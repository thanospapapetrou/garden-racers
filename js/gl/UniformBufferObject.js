'use strict';

class UniformBufferObject {
    #ubo;
    #offsets;

    constructor(gl, program, name, uniforms, index) {
        this.#ubo = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.#ubo);
        gl.bufferData(gl.UNIFORM_BUFFER, gl.getActiveUniformBlockParameter(program,
                gl.getUniformBlockIndex(program, name), gl.UNIFORM_BLOCK_DATA_SIZE), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, index, this.#ubo);
        const offsets = gl.getActiveUniforms(program, gl.getUniformIndices(program, uniforms), gl.UNIFORM_OFFSET);
        gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, name), index);
        this.#offsets = {};
        for (let i = 0; i < uniforms.length; i++) {
            this.#offsets[uniforms[i]] = offsets[i];
        }
    }

    get ubo() {
        return this.#ubo;
    }

    get offsets() {
        return this.#offsets;
    }
}
