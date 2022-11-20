const fs = require('fs')
const crypto = require('crypto')
const { exec } = require('child_process')

const filename = process.argv[2] // file to watch

let previousHash

/*
 * Clear the console, execute the file and show the result.
 */
const executeFile = path => {
  console.log('\x1Bc') // clear console

  exec(`node ${path}`, (error, stdout, stderr) => {
    if (error) {
      console.error(error)
      return
    }

    console.log(stdout)
    if (stderr !== "") console.log(stderr)
  })
}

/*
 * Checksum generator
 * This hasher is made to handle big files.
 */
const checksum = path => new Promise((resolve, reject) => {
  const hash = crypto.createHash('md5')
  const stream = fs.createReadStream(path)

  stream.on('error', reject)
  stream.on('data', data => hash.update(data, 'utf8'))
  stream.on('end', () => resolve(hash.digest('hex')))
})

/* 
 * Checksum is used for comparison between file changes.
 * If the hash is still the same, file content has not changed.
 * It also avoid 'fs.watch' to fire the 'executeFile' function twice.
 */
fs.watch(filename).on('change', async () => {
  await checksum(filename)
    .then(hash => {
      if (hash === previousHash) return
      previousHash = hash

      executeFile(filename)
    })
    .catch(error => console.log(error))
})

executeFile(filename) // first file exec
