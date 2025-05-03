'use strict';

class AttributeData extends RenderingData {
    constructor(gl, data) {
        super(gl, gl.ARRAY_BUFFER, new Float32Array(data));
    }
}
