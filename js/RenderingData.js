'use strict';

class RenderingData {
    #buffer;

    get buffer() {
        return this.#buffer;
    }

    constructor(gl, type, data) {
        this.#buffer = gl.createBuffer();
        gl.bindBuffer(type, this.#buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
    }
}
