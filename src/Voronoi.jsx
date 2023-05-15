import React, { useEffect } from "react";
import { useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import useMeasure from "react-use-measure";
import { Perf } from "r3f-perf";

import * as THREE from "three";

const geometry = new THREE.PlaneGeometry(2, 2);
const shader = new THREE.ShaderMaterial({
	uniforms: {
		u_time: { value: 0.0 },
		u_resolution: {
			value: new THREE.Vector2(0, 0),
		},
		u_mouse: { value: new THREE.Vector2(0.0, 0.0) },
		u_seedPixels: { value: new THREE.DataTexture() },
		u_stepSize: { value: 0.0 },
	},
	vertexShader: /*glsl*/ `        
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
	fragmentShader: /*glsl*/ `
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform sampler2D u_seedPixels;
        uniform float u_stepSize;
        
        void main() {
            vec2 p = gl_FragCoord.xy/u_resolution.xy;
            vec4 pColour = texture2D(u_seedPixels, p);
            // gl_FragColor = vec4(p, 0.0, 1.0);
            //for each neighbor q at (x+i, y+j) where i,j = -stepSize, 0, stepSize
            for (int x=-1; x<=1; x++) {
                for (int y=-1; y<=1; y++) {
                    vec2 q = vec2(p.x + float(x)*u_stepSize, p.y + float(y)*u_stepSize);
                    vec4 qColour = texture2D(u_seedPixels, q);
                    //gl_FragColor = qColour;
                    if (pColour == vec4(0.0, 0.0, 0.0, 0.0)) {
                        if (qColour != vec4(0.0, 0.0, 0.0, 0.0)) {
                            float distance = distance(p, q);
                            pColour = vec4(qColour.rgb, distance);
                        }
                    }
                    if (pColour != vec4(0.0, 0.0, 0.0, 0.0)) {
                        if (qColour != vec4(0.0, 0.0, 0.0, 0.0)) {
                            if (pColour.a < qColour.a) {
                                float distance = distance(p, q);
                                pColour = vec4(qColour.rgb, distance);
                            }
                        }
                    }
                }
            }
            gl_FragColor = pColour;

        }
    `,
});

const createTexture = (width, height, seedPixels) => {
	const data = new Uint8Array(width * height * 4);

	for (let i = 0; i < seedPixels.length; i++) {
		const x = Math.floor(seedPixels[i].x * width);
		const y = Math.floor(seedPixels[i].y * height);
		const index = (x + y * width) * 4;
		data[index] = Math.random() * 255;
		data[index + 1] = Math.random() * 255;
		data[index + 2] = 0;
		data[index + 3] = 255;
	}
	const texture = new THREE.DataTexture(
		data,
		width,
		height,
		THREE.RGBAFormat
	);
	texture.needsUpdate = true;

	return texture;
};

const Voronoi = ({ width, height }) => {
	const renderTargetA = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
	});
	const renderTargetB = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
	});

	const seedPixels = [
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.1, 0.1),
	];
	const seedPixelsTexture = createTexture(width, height, seedPixels);
	

	useFrame((state, delta, xrFrame) => {
		shader.uniforms.u_time.value += delta;
		const { gl, scene, camera } = state;

        // shader.uniforms.u_seedPixels.value = seedPixelsTexture;
		// shader.uniforms.u_stepSize.value = 1/1;
        
		// gl.setRenderTarget(renderTargetA);
		// gl.render(scene, camera);
		// gl.setRenderTarget(null);

		// shader.uniforms.u_seedPixels.value = renderTargetA.texture;
		// shader.uniforms.u_stepSize.value = 1/2;

		// gl.setRenderTarget(renderTargetB);
		// gl.render(scene, camera);
		// gl.setRenderTarget(null);

        // shader.uniforms.u_seedPixels.value = renderTargetB.texture;
		// shader.uniforms.u_stepSize.value = 1/4;

		let stepSize = 1.0;
		shader.uniforms.u_stepSize.value = stepSize;
		shader.uniforms.u_seedPixels.value = seedPixelsTexture;

		let current = renderTargetA;
		let next = renderTargetB;

		gl.setRenderTarget(current);
		gl.render(scene, camera);
		gl.setRenderTarget(null);

		while (stepSize > 1/4) {
            stepSize /= 2.0;

		    shader.uniforms.u_stepSize.value = stepSize;
		    shader.uniforms.u_seedPixels.value = current.texture;

		    gl.setRenderTarget(next);
		    gl.render(scene, camera);
		    gl.setRenderTarget(null);

		    const temp = current;
		    current = next;
		    next = temp;
		}

	});

	shader.uniforms.u_resolution.value = new THREE.Vector2(width, height);
	return <mesh geometry={geometry} material={shader} />;
};

const App = (props) => {
	const [backgroundColor, setBackgroundColor] = useState("#000000");
	const [ref, bounds] = useMeasure();

	const getURLparams = () => {
		const urlParams = new URLSearchParams(window.location.search);
	};
	useEffect(() => {
		getURLparams();
	}, []);

	const urlToClipboard = () => {
		const url = new URL(window.location.href);
		navigator.clipboard.writeText(url.href);
	};

	return (
		<div className="flex flex-col pt-5 no-type">
			<div className="flex justify-center">
				<div
					className="flex flex-col rounded-lg items-center"
					style={{
						height: "50vh",
						width: "50vh",
						backgroundColor: backgroundColor,
					}}
					ref={ref}
				>
					<Canvas
						className="flex rounded-lg"
						gl={{
							premultipliedAlpha: false,
						}}
					>
						<Perf />
						<Voronoi
							height={bounds.height * window.devicePixelRatio}
							width={bounds.width * window.devicePixelRatio}
						/>
					</Canvas>
				</div>
			</div>
			<div className="flex flex-col">
				<button onClick={urlToClipboard}>Copy Link! Share it!</button>
			</div>
		</div>
	);
};

export default App;
