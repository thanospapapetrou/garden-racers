'use strict';

class VertexBufferObject {
    #vbo;

    constructor(gl, type, data, usage) {
        this.#vbo = gl.createBuffer();
        gl.bindBuffer(type, this.#vbo);
        gl.bufferData(type, data, usage);
        gl.bindBuffer(type, null);
    }

    get vbo() {
        return this.#vbo;
    }
}
