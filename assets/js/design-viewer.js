/**
 * Design viewer: opens tall design mockups at readable width in a scrollable,
 * zoomable dialog. Opt in by giving a link the class "design-viewer"; the
 * link's href is the image and its title is the caption.
 */
(function() {
  "use strict";

  const ZOOM_STEP = 1.25;
  const MAX_SCALE = 2;

  function createDesignViewer(doc) {
    const dialog = buildDialog(doc);
    const stage = dialog.querySelector(".dv-stage");
    const image = dialog.querySelector(".dv-image");
    const title = dialog.querySelector(".dv-title");
    const zoomLabel = dialog.querySelector(".dv-zoom-reset");
    const counter = dialog.querySelector(".dv-counter");
    const prevButton = dialog.querySelector(".dv-prev");
    const nextButton = dialog.querySelector(".dv-next");
    const divider = dialog.querySelector(".dv-divider");

    let scale = 1;
    let items = [];
    let index = 0;

    function fitScale() {
      return Math.min(1, stage.clientWidth / image.naturalWidth);
    }

    function minScale() {
      return Math.min(fitScale(), stage.clientHeight / image.naturalHeight);
    }

    // Zooms so the content point under (anchorX, anchorY) in the stage stays put.
    function setScale(next, anchorX, anchorY) {
      if (!image.naturalWidth) return;
      const clamped = Math.min(MAX_SCALE, Math.max(minScale(), next));
      const contentX = (stage.scrollLeft + anchorX) / scale;
      const contentY = (stage.scrollTop + anchorY) / scale;
      scale = clamped;
      image.style.width = Math.round(image.naturalWidth * scale) + "px";
      stage.scrollLeft = contentX * scale - anchorX;
      stage.scrollTop = contentY * scale - anchorY;
      zoomLabel.textContent = Math.round(scale * 100) + "%";
    }

    function zoomAroundCentre(factor) {
      setScale(scale * factor, stage.clientWidth / 2, stage.clientHeight / 2);
    }

    function resetToFitWidth() {
      setScale(fitScale(), 0, 0);
      stage.scrollTop = 0;
    }

    function show(position) {
      index = (position + items.length) % items.length;
      const item = items[index];
      title.textContent = item.caption;
      image.alt = item.caption || "Design preview";
      image.removeAttribute("style");
      zoomLabel.textContent = "…";
      const several = items.length > 1;
      prevButton.hidden = !several;
      nextButton.hidden = !several;
      counter.hidden = !several;
      divider.hidden = !several;
      counter.textContent = (index + 1) + " / " + items.length;
      image.onload = resetToFitWidth;
      image.src = item.src;
      if (image.complete && image.naturalWidth) resetToFitWidth();
    }

    // items: [{ src, caption }]; start: index of the item to show first.
    function open(list, start) {
      if (!list.length) return;
      items = list;
      if (!dialog.open) {
        dialog.showModal();
        doc.documentElement.classList.add("dv-open");
      }
      show(start);
    }

    function step(delta) {
      if (items.length > 1) show(index + delta);
    }

    function close() {
      dialog.close();
    }

    dialog.addEventListener("close", function() {
      doc.documentElement.classList.remove("dv-open");
    });

    // Clicking the dark backdrop (outside the panel) closes the viewer.
    dialog.addEventListener("click", function(event) {
      if (event.target === dialog) close();
    });

    dialog.querySelector(".dv-close").addEventListener("click", close);
    dialog.querySelector(".dv-zoom-in").addEventListener("click", function() {
      zoomAroundCentre(ZOOM_STEP);
    });
    dialog.querySelector(".dv-zoom-out").addEventListener("click", function() {
      zoomAroundCentre(1 / ZOOM_STEP);
    });
    zoomLabel.addEventListener("click", resetToFitWidth);
    prevButton.addEventListener("click", function() {
      step(-1);
    });
    nextButton.addEventListener("click", function() {
      step(1);
    });

    // Plain wheel scrolls natively; Ctrl/Cmd + wheel (and trackpad pinch) zooms at the cursor.
    stage.addEventListener("wheel", function(event) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.002);
      setScale(scale * factor, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });

    dialog.addEventListener("keydown", function(event) {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomAroundCentre(ZOOM_STEP);
      } else if (event.key === "-") {
        event.preventDefault();
        zoomAroundCentre(1 / ZOOM_STEP);
      } else if (event.key === "0") {
        event.preventDefault();
        resetToFitWidth();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });

    enableDragToPan(stage);

    return { open: open, close: close };
  }

  // Mouse drag pans the stage; touch keeps native scrolling.
  function enableDragToPan(stage) {
    let drag = null;

    stage.addEventListener("pointerdown", function(event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = {
        x: event.clientX,
        y: event.clientY,
        left: stage.scrollLeft,
        top: stage.scrollTop
      };
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("dv-dragging");
      event.preventDefault();
    });

    stage.addEventListener("pointermove", function(event) {
      if (!drag) return;
      stage.scrollLeft = drag.left - (event.clientX - drag.x);
      stage.scrollTop = drag.top - (event.clientY - drag.y);
    });

    function endDrag() {
      drag = null;
      stage.classList.remove("dv-dragging");
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
  }

  function buildDialog(doc) {
    const dialog = doc.createElement("dialog");
    dialog.className = "design-viewer-dialog";
    dialog.setAttribute("aria-label", "Design preview");
    dialog.innerHTML =
      '<div class="dv-panel">' +
        '<div class="dv-toolbar">' +
          '<div class="dv-heading">' +
            '<span class="dv-title"></span>' +
            '<span class="dv-counter"></span>' +
          '</div>' +
          '<div class="dv-controls">' +
            '<button type="button" class="dv-prev" aria-label="Previous" title="Previous (←)"><i class="bx bx-chevron-left"></i></button>' +
            '<button type="button" class="dv-next" aria-label="Next" title="Next (→)"><i class="bx bx-chevron-right"></i></button>' +
            '<span class="dv-divider" aria-hidden="true"></span>' +
            '<button type="button" class="dv-zoom-out" aria-label="Zoom out" title="Zoom out (-)"><i class="bx bx-zoom-out"></i></button>' +
            '<button type="button" class="dv-zoom-reset" aria-label="Fit to width" title="Fit to width (0)">100%</button>' +
            '<button type="button" class="dv-zoom-in" aria-label="Zoom in" title="Zoom in (+)"><i class="bx bx-zoom-in"></i></button>' +
            '<button type="button" class="dv-close" aria-label="Close" title="Close (Esc)"><i class="bx bx-x"></i></button>' +
          '</div>' +
        '</div>' +
        '<div class="dv-stage"><img class="dv-image" alt="" draggable="false"></div>' +
        '<div class="dv-hint">Scroll to explore · Ctrl + scroll or the buttons to zoom · drag to pan · ← → to browse</div>' +
      '</div>';
    doc.body.appendChild(dialog);
    return dialog;
  }

  // Links hidden by the portfolio filter (display: none) have no layout box.
  function isShown(link) {
    return link.getClientRects().length > 0;
  }

  function toItem(link) {
    return { src: link.getAttribute("href"), caption: link.getAttribute("title") || "" };
  }

  function bindDesignViewerLinks(doc, viewer) {
    doc.addEventListener("click", function(event) {
      const link = event.target.closest("a.design-viewer");
      if (!link) return;
      event.preventDefault();
      const links = Array.from(doc.querySelectorAll("a.design-viewer")).filter(function(candidate) {
        return candidate === link || isShown(candidate);
      });
      viewer.open(links.map(toItem), links.indexOf(link));
    });
  }

  if (typeof HTMLDialogElement !== "function") return;
  bindDesignViewerLinks(document, createDesignViewer(document));
})();
