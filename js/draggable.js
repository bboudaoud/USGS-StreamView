"use strict";

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

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

function dragOver(evt) {
    evt.preventDefault();
    const dragging = document.querySelector('.dragging');
    const parent = evt.target.parentNode;
    if (dragging == undefined || parent == undefined || dragging.parentNode != parent) {
        // Make sure we stay within the same parent div
        return;
    }
    // Get the element we are over
    const afterElement = getDragAfterElement(parent, evt.clientY);
    if (afterElement == null) {
        parent.appendChild(dragging);
    } else {
        parent.insertBefore(dragging, afterElement);
    }
}

export function setContainer(container) {
    // Add an event listener to the container for the drag over event
    container.addEventListener('dragover', dragOver);
}

export function addDraggable(element) {
    element.addEventListener('dragstart', () => {
        element.classList.add('dragging');
    });
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
    });
}