const fs = require("fs")
const { promises } = fs
const Path = require("path")
const options = {
  inputDir: "/",
}

module.exports = async function build(main) {
  const rootJson = await resolveAsset(Path.resolve(main || ""))
  options.inputDir = Path.dirname(rootJson.path)
  await loadAsset(rootJson)
  return rootJson
}

async function loadAsset(asset) {
  if (asset.path) {
    const input = await promises.readFile(asset.path)
    await asset.parse(input.toString())
    await asset.generate()
  }

  let siblings = [".wxml", ".js", ".wxss"]

  if (asset.type === "page" || asset.type === "component") {
    siblings = siblings.map(async (type) => {
      if (asset.parent) {
        const depAsset = await resolveAsset(asset.path.replace(".json", type))
        asset.siblingAssets.set(type, depAsset)
        depAsset.parent = asset
        await loadAsset(depAsset)
      }
    })
  }

  const dependencies = Array.from(asset.dependencies)
  const childs = dependencies.map(async (dep) => {
    const depAsset = await resolveAsset(
      dep.path.replace(dep.ext, "") + dep.ext,
      asset.path
    )
    depAsset.tag = dep.tag
    asset.childAssets.set(dep.path, depAsset)
    depAsset.parent = asset
    await loadAsset(depAsset)
  })
  await Promise.all(siblings.concat(childs))
}

async function resolveAsset(path = "", parent) {
  let type = Path.extname(path)
  switch (type) {
    case ".js":
      Asset = require("./assets/js")
      break
    case ".json":
      Asset = require("./assets/json").App
      break
    case ".page":
      Asset = require("./assets/json").Page
      break
    case ".component":
      Asset = require("./assets/json").Component
      break
    case ".wxml":
      Asset = require("./assets/wxml")
      break
    case ".wxss":
      Asset = require("./assets/wxss")
      break
    default:
      break
  }

  path = path.replace(".component", ".json").replace(".page", ".json")
  type = type === ".json" ? ".app" : type

  let resolvePath = parent ? Path.join(Path.dirname(parent), path) : path
  if (!fs.existsSync(resolvePath)) {
    resolvePath = Path.join(options.inputDir, path)
  }
  return new Asset(resolvePath, type, path)
}

module.exports.options = options
