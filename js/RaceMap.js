'use strict';

class RaceMap {
    static #SHADER_FRAGMENT = './glsl/map.frag';
    static #SHADER_VERTEX = './glsl/map.vert';
    static #UNIFORMS = {
       projection: (gl, uniform, projection) => gl.uniformMatrix4fv(uniform, false, projection),
       camera: (gl, uniform, camera) => gl.uniformMatrix4fv(uniform, false, camera),
       model: (gl, uniform, model) => gl.uniformMatrix4fv(uniform, false, model),
       light: {
           ambient: (gl, uniform, color) => gl.uniform3fv(uniform, color),
           directional: {
               color: (gl, uniform, color) => gl.uniform3fv(uniform, color),
               direction: (gl, uniform, direction) => gl.uniform3fv(uniform, direction)
           }
       }
   };

    #gl;
    #renderer;

    constructor(gl) {
        this.#gl = gl;
        return (async () => {
            this.#renderer = await new Renderer(this.#gl, RaceMap.#SHADER_VERTEX, RaceMap.#SHADER_FRAGMENT,
                    RaceMap.#UNIFORMS, []);
            // TODO refactor
            const indices = this.#gl.createBuffer();
            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indices);
            this.#gl.bufferData(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2]), this.#gl.STATIC_DRAW);
            return this;
        })();
    }

    render(projection, camera, model) {
        this.#gl.useProgram(this.#renderer.program);
        this.#renderer.uniforms.projection = projection;
        this.#renderer.uniforms.camera = camera;
        this.#renderer.uniforms.model = model;
        this.#renderer.uniforms.light.ambient = [0.25, 0.25, 0.25]; // 25% white TODO
        this.#renderer.uniforms.light.directional.color = [0.75, 0.75, 0.75]; // 75% white TODO
        this.#renderer.uniforms.light.directional.direction = [-1.0, -1.0, -1.0]; //  TODO
        // TODO render


        this.#gl.drawArraysInstanced(
          this.#gl.TRIANGLES,
          0,             // offset
          3,   // num vertices per instance
          5,  // num instances
        );
    }
}
