'use strict';

class RenderingData {
    #buffer;

    constructor(gl, type, data) {
        this.#buffer = gl.createBuffer();
        gl.bindBuffer(type, this.#buffer);
        gl.bufferData(type, data, gl.STATIC_DRAW);
        gl.bindBuffer(type, null);
    }

    get buffer() {
        return this.#buffer;
    }
}
