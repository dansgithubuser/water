https://dansgithubuser.github.io/water/

This was created as an exploration of https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample7/webgl-demo.js. Despite the ugly and probably incorrect result, I think this has been achieved. Here are a few things I learned.
- Gerstner waves accurately model the surface of an incompressible fluid in gravity.
- It'd probably be easiest to render the water surface as a single square. There aren't enough polygons to make this work right by itself.
- Following, normal calculation should be done in fragment shader. In which case I don't think you can do Gerstner waves.
- The article is terse, but I think that's what they did: Gerstner waves in vertex shader, sinusoidal waves in fragment. They mention keeping the wavelength large enough given how many samples you have, but I found even if I did that there were interpolation artifacts. Not sure why. The source code accompanying is very proprietary and doesn't seem to cut to the chase, at first glance anyway.
