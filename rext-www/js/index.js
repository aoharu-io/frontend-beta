// For development
document.addEventListener("keypress", e => {
    if (e.key == "l") document.body.setAttribute("data-theme", "light")
    else if (e.key == "d") document.body.setAttribute("data-theme", "dark")
})

const params = new URLSearchParams(location.search)

let language = "ja"
const languageList = ["ja", "en"]
if (languageList.includes(params.get("lang"))) {
    language = params.get("lang")
} else if (languageList.includes(localStorage.getItem("language"))) {
    language = localStorage.getItem("language")
} else if (languageList.includes(navigator.language)) {
    language = navigator.language
}
document.body.setAttribute("data-language", language)

let theme = "light"
if (["light", "dark"].includes(params.get("theme"))) {
    theme = params.get("theme")
} else if (["light", "dark"].includes(localStorage.getItem("theme"))) {
    theme = localStorage.getItem("theme")
} else if (matchMedia("(prefers-color-scheme: dark)").matches) {
    theme = "dark"
}
document.body.setAttribute("data-theme", theme)



const canvas = document.querySelector(".background")
canvas.width = document.documentElement.clientWidth
canvas.height = document.documentElement.clientHeight
const gl = canvas.getContext("webgl")

const numMetaballs = Math.round(canvas.height * canvas.width / 16000)

const metaballs = []

for (var i = 0; i < numMetaballs; i++) {
    const radius = Math.random() * 60 + 10
    metaballs.push({
        x: Math.random() * (canvas.width - 2 * radius) + radius,
        y: Math.random() * (canvas.height - 2 * radius) + radius,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        r: radius * 0.75
    })
}

const vertexShaderSrc = `
    attribute vec2 position;

    void main() {
        // position specifies only x and y.
        // We set z to be 0.0, and w to be 1.0
        gl_Position = vec4(position, 0.0, 1.0);
    }
`

const fragmentShaderSrc = `
    precision highp float;

    const float WIDTH = ${canvas.width >> 0}.0;
    const float HEIGHT = ${canvas.height >> 0}.0;

    uniform vec3 metaballs[${numMetaballs}];

    void main(){
        float x = gl_FragCoord.x;
        float y = gl_FragCoord.y;

        float sum = 0.0;
        for (int i = 0; i < ${numMetaballs}; i++) {
            vec3 metaball = metaballs[i];
            float dx = metaball.x - x;
            float dy = metaball.y - y;
            float radius = metaball.z;

            sum += (radius * radius) / (dx * dx + dy * dy);
        }

        if (sum >= 0.99) {
            gl_FragColor = vec4(mix(vec3(x / WIDTH, y / HEIGHT, 1.0), vec3(0, 0, 0), max(0.0, 1.0 - (sum - 0.99) * 100.0)), 1.0);
            return;
        }

        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

`


const program = gl.createProgram()
gl.attachShader(program, compileShader(vertexShaderSrc, gl.VERTEX_SHADER))
gl.attachShader(program, compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER))
gl.linkProgram(program)
gl.useProgram(program)

var vertexData = new Float32Array([
    -1.0, 1.0, // top left
    -1.0, -1.0, // bottom left
    1.0, 1.0, // top right
    1.0, -1.0, // bottom right
])
var vertexDataBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer)
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)

var positionHandle = getAttribLocation(program, "position")
gl.enableVertexAttribArray(positionHandle)
gl.vertexAttribPointer(positionHandle,
    2, // position is a vec2
    gl.FLOAT, // each component is a float
    gl.FALSE, // don't normalize values
    2 * 4, // two 4 byte float components per vertex
    0 // offset into each span of vertex data
)

var metaballsHandle = getUniformLocation(program, "metaballs")

loop()
function loop() {
    for (var i = 0; i < numMetaballs; i++) {
        var metaball = metaballs[i]
        metaball.x += metaball.vx
        metaball.y += metaball.vy

        if (metaball.x < metaball.r || metaball.x > canvas.width - metaball.r) metaball.vx *= -1
        if (metaball.y < metaball.r || metaball.y > canvas.height - metaball.r) metaball.vy *= -1
    }

    var dataToSendToGPU = new Float32Array(3 * numMetaballs)
    for (var i = 0; i < numMetaballs; i++) {
        var baseIndex = 3 * i
        var mb = metaballs[i]
        dataToSendToGPU[baseIndex + 0] = mb.x
        dataToSendToGPU[baseIndex + 1] = mb.y
        dataToSendToGPU[baseIndex + 2] = mb.r
    }
    gl.uniform3fv(metaballsHandle, dataToSendToGPU)

    //Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    requestAnimationFrame(loop)
}

function compileShader(shaderSource, shaderType) {
    var shader = gl.createShader(shaderType)
    gl.shaderSource(shader, shaderSource)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader)
    }

    return shader
}

function getUniformLocation(program, name) {
    var uniformLocation = gl.getUniformLocation(program, name)
    if (uniformLocation === -1) {
        throw "Can not find uniform " + name + "."
    }
    return uniformLocation
}

function getAttribLocation(program, name) {
    var attributeLocation = gl.getAttribLocation(program, name)
    if (attributeLocation === -1) {
        throw "Can not find attribute " + name + "."
    }
    return attributeLocation
}
