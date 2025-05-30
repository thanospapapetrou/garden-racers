'use strict';

class UniformBufferObject {
    #ubo;
    #offsets;

    constructor(gl, program, name, index, names) {
        const blockIndex = gl.getUniformBlockIndex(program, name);
        const blockSize = gl.getActiveUniformBlockParameter(program, blockIndex, gl.UNIFORM_BLOCK_DATA_SIZE);
        this.#ubo = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.#ubo);
        gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        gl.bindBufferBase(gl.UNIFORM_BUFFER, index, this.#ubo);
        const uboVariableIndices = gl.getUniformIndices(program, names);
        const uboVariableOffsets = gl.getActiveUniforms(program, uboVariableIndices, gl.UNIFORM_OFFSET);

        gl.uniformBlockBinding(program, blockIndex, index);
        this.#offsets = {};
        for (let i = 0; i < names.length; i++) {
            this.#offsets[names[i]] = uboVariableOffsets[i];
        }
    }

    get ubo() {
        return this.#ubo;
    }

    get offsets() {
        return this.#offsets;
    }

//
//      const onRender = () => {
//        // ==== START OF PART C ====
//
//        gl.bindBuffer(gl.UNIFORM_BUFFER, uboBuffer);
//
//        // Push some data to our Uniform Buffer
//
//        gl.bufferSubData(
//          gl.UNIFORM_BUFFER,
//          uboVariableInfo["u_PointSize"].offset,
//          new Float32Array([Math.random() * 100.0 + 100.0]),
//          0
//        );
//        gl.bufferSubData(
//          gl.UNIFORM_BUFFER,
//          uboVariableInfo["u_Color"].offset,
//          new Float32Array([Math.random(), 0.25, 0.25]),
//          0
//        );
//
//        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
}
