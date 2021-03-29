const Asset = require("./asset")
const postcss = require("postcss")
const postcssTagReplacer = require("../plugins/postcss-tag-replacer")
const postcssRpx2rem = require("../plugins/postcss-rpx2rem")
const postcssSopedCss = require("../plugins/postcss-scoped-css")

module.exports = class Wxss extends Asset {
  constructor(path, type, name) {
    super(path, type, name)
  }
  async parse(input) {
    this.input = input
  }

  addDep(){
    let that = this
    return {
      postcssPlugin: "postcss-add-dep",
      AtRule(node) {
        if(node.name === 'import'){
          const dep = { path: node.params.replace(/"/g,''), ext: ".wxss" }
          that.dependencies.add(dep)
          node.type = 'comment'
          node.text = JSON.stringify(dep)
        }
      },
      Rule(node){
        

      }
    }
  }

  async generate() {
    const wxml = this.parent.siblingAssets.get(".wxml")
    const id = wxml ? `data-w-${wxml.hash.slice(0, 6)}` : null
    const scoped = false
    this.code = postcss([
      postcssTagReplacer({
        // css 需要替换的标签
        replaceMap: {
          view: "div",
          icon: "i",
          text: "span",
          navigator: "a",
          image: "img",
        },
      }),
      this.addDep(),
      // postcssSopedCss({
      //   id,
      // }),
      postcssRpx2rem(),
    ]).process(this.input).css
  }
}
