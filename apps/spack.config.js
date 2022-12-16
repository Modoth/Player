/* eslint-disable require-jsdoc */
const path = require('path')
const fs = require('fs')

class FileUtils {
  /**
     *
     * @param {string} file
     * @return { string[] }
     */
  static readdir(file) {
    return new Promise((resolve, reject) => {
      fs.readdir(file, (err, files) => {
        if (err) {
          reject(err)
        } else {
          resolve(files)
        }
      })
    })
  }

static exists(file) {
    return new Promise((resolve) => {
      fs.exists(file, resolve)
    })
  }
}

const getLocalConfigs = async () => {
  const srcFolder = path.join(__dirname, 'src')
  const subfolders = await FileUtils.readdir(srcFolder)
  const entries = {}
  let localCfg
  const localCfgFile =
    process.env.SPACK_CONFIG_FILE || './.local.spack.config.js'
  if (localCfgFile && (await FileUtils.exists(localCfgFile))) {
    try {
      localCfg = require(localCfgFile)
    } catch {
      console.log(`Config File Error: ${localCfgFile}`)
    }
  }
  for (const subfolder of subfolders) {
    let indexFile
    let template
    let extractCss = true
    const includeTemplate = false
    let monolith = false
    for (const fileName of ['index.html', 'app.html']) {
      const file = path.join(srcFolder, subfolder, fileName)
      if (await FileUtils.exists(file)) {
        indexFile = file
        switch (fileName) {
          case 'app.html':
            template = 'src/fast/index.html'
            extractCss = false
            monolith = true
            break
        }
        break
      }
    }
    if (subfolder === 'fast') {
      extractCss = false
    }
    if (!indexFile) {
      continue
    }
    entries[subfolder] = Object.assign(
      { path: indexFile, template, extractCss, monolith, includeTemplate },
      localCfg && localCfg.entries && localCfg.entries[subfolder]
    )
  }
  return {
    cd: (localCfg && localCfg.cd) || {},
    dist: localCfg && localCfg.dist,
    entries
  }
}

module.exports = getLocalConfigs().then(({ cd, dist, entries }) => ({
  entries,
  output: {
    path: path.join(__dirname, dist || 'dist'),
    filename: '[name]'
  },
  cd
}))
