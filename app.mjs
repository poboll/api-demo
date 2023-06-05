// 引入Express模块
import express from 'express'
import proxy from 'express-http-proxy'

// 创建一个Express应用
const app = express()
const port = process.env.PORT || 80

// 设置静态资源文件夹
app.use(express.static('./public'))

app.post('/api', proxy('https://gpt-api.serendipitous-clue.com/', {
  proxyReqPathResolver: () => '/'
}))

// 监听指定端口并启动服务器
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
