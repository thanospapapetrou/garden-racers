'use strict';

class IndexData extends RenderingData {
    #count;

    constructor(gl, data) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data));
        this.#count = data.length;
    }

    get count() {
        return this.#count;
    }
}
