'use strict';

class VertexArrayObject {
    #vao;

    constructor(gl, attributes, indices) {
        this.#vao = gl.createVertexArray();
        gl.bindVertexArray(this.#vao);
        for (let attribute of attributes) {
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.vbo.vbo);
            gl.vertexAttribPointer(attribute.location, attribute.size, attribute.type, attribute.normalized ?? false,
                    attribute.stride ?? 0, attribute.offset ?? 0);
            gl.enableVertexAttribArray(attribute.location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.vbo);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    get vao() {
        return this.#vao;
    }
}