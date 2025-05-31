'use strict';

class UniformBufferObject {
    #gl;
    #ubo;
    #offsets;

    constructor(gl, index, program, name, uniforms) {
        this.#gl = gl;
        this.#ubo = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.UNIFORM_BUFFER, this.#ubo);
        this.#gl.bufferData(this.#gl.UNIFORM_BUFFER, this.#gl.getActiveUniformBlockParameter(program,
                this.#gl.getUniformBlockIndex(program, name), this.#gl.UNIFORM_BLOCK_DATA_SIZE), this.#gl.DYNAMIC_DRAW);
        this.#gl.bindBuffer(this.#gl.UNIFORM_BUFFER, null);
        this.#gl.bindBufferBase(this.#gl.UNIFORM_BUFFER, index, this.#ubo);
        const offsets = this.#gl.getActiveUniforms(program, this.#gl.getUniformIndices(program, uniforms),
                this.#gl.UNIFORM_OFFSET);
        this.#gl.uniformBlockBinding(program, this.#gl.getUniformBlockIndex(program, name), index);
        this.#offsets = {};
        for (let i = 0; i < uniforms.length; i++) {
            this.#offsets[uniforms[i]] = offsets[i];
        }
    }

    setUniforms(uniforms) {
        this.#gl.bindBuffer(this.#gl.UNIFORM_BUFFER, this.#ubo);
        for (let name of Object.keys(uniforms)) {
            this.#gl.bufferSubData(this.#gl.UNIFORM_BUFFER, this.#offsets[name], uniforms[name], 0);
        }
        this.#gl.bindBuffer(this.#gl.UNIFORM_BUFFER, null);
    }
}
