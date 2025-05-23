'use strict';

class RenderingTask { // TODO https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880
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
        this.#setUniforms(this.#renderer.uniforms, uniforms);
        this.#gl.bindVertexArray(this.#array);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(null);
    }

    #setUniforms(uniforms, values) {
        for (let uniform of Object.keys(values)) {
            if ((values[uniform] instanceof Array) || (values[uniform] instanceof Float32Array)
                    || (values[uniform] instanceof Texture)) {
                uniforms[uniform] = values[uniform];
            } else {
                this.#setUniforms(uniforms[uniform], values[uniform]);
            }
        }
    }
}
