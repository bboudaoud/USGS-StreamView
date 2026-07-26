"use strict";

// Active pointer drag (handle-based; works on touch and mouse)
var activeDrag = null;

function getDragAfterElement(container, y) {
    // Only reorder among sibling .draggable children
    const draggableElements = [...container.children].filter(child => {
        return child.classList.contains('draggable') && !child.classList.contains('dragging');
    });

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function onPointerMove(evt) {
    if (activeDrag == null) {
        return;
    }
    // Prevent page scroll while dragging on touch
    evt.preventDefault();

    const element = activeDrag.element;
    const parent = activeDrag.parent;
    const afterElement = getDragAfterElement(parent, evt.clientY);
    if (afterElement == null) {
        parent.appendChild(element);
    } else {
        parent.insertBefore(element, afterElement);
    }
}

function endDrag() {
    if (activeDrag == null) {
        return;
    }
    const element = activeDrag.element;
    const handle = activeDrag.handle;
    const pointerId = activeDrag.pointerId;

    element.classList.remove('dragging');
    try {
        handle.releasePointerCapture(pointerId);
    } catch (e) {
        // Ignore if capture was already released
    }

    activeDrag = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
}

export function setContainer(container) {
    // Kept for API compatibility. Pointer drag uses the item's parent, not a container listener.
}

export function addDraggable(element, handle) {
    if (handle == undefined) {
        handle = element;
    }

    handle.addEventListener('pointerdown', (evt) => {
        // Primary mouse button only; touch/pen have button 0
        if (evt.button !== 0) {
            return;
        }
        // Do not start a drag from nested interactive targets inside the handle
        evt.preventDefault();
        evt.stopPropagation();

        activeDrag = {
            element: element,
            handle: handle,
            parent: element.parentNode,
            pointerId: evt.pointerId,
        };
        element.classList.add('dragging');
        handle.setPointerCapture(evt.pointerId);

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    });
}