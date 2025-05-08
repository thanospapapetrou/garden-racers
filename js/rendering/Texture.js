'use strict';

class Texture {
    #texture;

    constructor(gl, url) {
        // TODO cleanup
        this.#texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, this.#texture); // TODO unbind texture

        // Fill the texture with a 1x1 blue pixel.
        // TODO target, level, internalformat, width, height, border, format, type, source
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                        new Uint8Array([0, 0, 255, 255]));

        // Asynchronously load an image
        var image = new Image();
        image.src = url;
        const t = this.#texture;
        image.addEventListener('load', function() {
          // Now that the image has loaded make copy it to the texture.
          gl.bindTexture(gl.TEXTURE_2D, t); // TODO unbound texture
          // texImage2D(target, level, internalformat, format, type, pixels)

          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
          gl.generateMipmap(gl.TEXTURE_2D);
        });
    }

    get texture() {
        return this.#texture;
    }
}
