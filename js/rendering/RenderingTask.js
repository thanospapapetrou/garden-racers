'use strict';

class RenderingTask {
    #gl;
    #renderer;
    #array;
    #count;

    constructor(gl, renderer, attributes, indices) {
        this.#gl = gl;
        this.#renderer = renderer;
        this.#array = this.#gl.createVertexArray();
        this.#gl.bindVertexArray(this.#array);
        for (let attribute of Object.keys(attributes)) {
            this.#renderer.attributes[attribute] = attributes[attribute];
        }
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
        this.#gl.bindVertexArray(null);
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null);
        this.#count = indices.count;
    }

    render(uniforms) {
        this.#gl.useProgram(this.#renderer.program);
        for (let uniform of Object.keys(uniforms)) {
            this.#renderer.uniforms[uniform] = uniforms[uniform];
        }
        this.#renderer.uniforms.light.ambient = [0.25, 0.25, 0.25]; // 25% white TODO
        this.#renderer.uniforms.light.directional.color = [0.75, 0.75, 0.75]; // 75% white TODO
        this.#renderer.uniforms.light.directional.direction = [-1.0, -1.0, -1.0]; //  TODO
        this.#gl.bindVertexArray(this.#array);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_SHORT, 0);
        this.#gl.bindVertexArray(null);
    }
}