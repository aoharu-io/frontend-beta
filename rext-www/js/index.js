const params = new URLSearchParams(location.search)

let language = "system"
const languageList = ["system", "ja", "en"]
if (languageList.includes(params.get("language"))) {
    language = params.get("language")
    localStorage.setItem("language", language)
} else if (languageList.includes(localStorage.getItem("language"))) {
    language = localStorage.getItem("language")
}
if (language == "system") {
    if (languageList.includes(navigator.language)) language = navigator.language
    else language = "ja"
}
document.body.setAttribute("data-language", language)

let theme = "system"
const themeList = ["system", "light", "dark"]
if (themeList.includes(params.get("theme"))) {
    theme = params.get("theme")
    localStorage.setItem("theme", theme)
} else if (themeList.includes(localStorage.getItem("theme"))) {
    theme = localStorage.getItem("theme")
}
if (theme == "system") {
    if (matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark"
    else theme = "light"
}
document.body.setAttribute("data-theme", theme)

new Vivus("background", { type: "oneByOne", duration: 1000 })
