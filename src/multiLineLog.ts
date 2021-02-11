export default (logObj: { [key: string]: any }) => {
  const logArrays = Object.keys(logObj).map(
    (key) => ['\n', key, logObj[key]]
  )
  console.info(...logArrays.flat())
}
