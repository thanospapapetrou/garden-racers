'use strict';

class RenderingTask { // TODO https://gist.github.com/jialiang/2880d4cc3364df117320e8cb324c2880
    #gl;
    #renderer;
    #array;
    #count;

    constructor(gl, renderer, attributes, indices, count) {
        this.#gl = gl;
        this.#renderer = renderer;
        this.#array = this.#gl.createVertexArray();
        this.#gl.bindVertexArray(this.#array);
        for (let attribute of Object.keys(attributes)) {
            gl.bindBuffer(gl.ARRAY_BUFFER, attributes[attribute].buffer);
            gl.vertexAttribPointer(this.#renderer.attributes[attribute], Vector.COMPONENTS, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.#renderer.attributes[attribute]);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indices.vbo);
        this.#gl.bindVertexArray(null);
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null);
        this.#count = count;
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
