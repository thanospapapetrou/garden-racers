'use strict';

class IndexData extends RenderingData {
    constructor(gl, data) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data));
    }
}
