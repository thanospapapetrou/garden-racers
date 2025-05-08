'use strict';

class Texture {
    #texture;

    constructor(gl, url) {
        return (async () => {
            // TODO cleanup
            var image = new Image();
            image.onload = () => {
                this.#texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + 0);
                gl.bindTexture(gl.TEXTURE_2D, this.#texture); // TODO unbound texture
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);
            };
            image.src = url;
            return this;
        })();
    }

    get texture() {
        return this.#texture;
    }
}
