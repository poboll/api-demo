window.onload = () => {
    const input_uuid = document.getElementById('uuid')
    const btn_submit = document.getElementById('submit')
    const btn_stop = document.getElementById('stop')
    const btn_clean = document.getElementById('clean')
    const btn_copy = document.getElementById('copy')
    const btn_refresh = document.getElementById('refresh')
    const textarea_prompt = document.getElementById('prompt')
    const input_balance = document.getElementById('balance')
    const textarea_container = document.getElementById('container')

    btn_submit?.addEventListener('click', () => doRequest())
    btn_stop?.addEventListener('click', () => doStop())
    btn_clean?.addEventListener('click', () => doClean())
    btn_copy?.addEventListener('click', () => doCopy())
    btn_refresh?.addEventListener('click', () => doRefresh())

    let messageList = []
    let temp
    let controller
    let loading

    const _push = (role, content) => {
        messageList.push({ role, content })
        _render()
    }

    const _reset = () => {
        messageList = []
        _render()
    }

    const _render = () => {
        textarea_prompt.value = ''
        textarea_container.value = ''
        messageList.forEach((message) => {
            textarea_container.value += message.role
            textarea_container.value += '\n'
            textarea_container.value += message.content
            textarea_container.value += '\n'
        })
    }

    const doRequest = async () => {
        if (loading) {
            alert('正在请求中')
            return
        }

        const uuid = input_uuid.value
        if (!uuid) {
            alert('无效身份令牌')
            return
        }

        const content = textarea_prompt.value
        if (!content) {
            alert('请输入内容')
            return
        }

        loading = true
        controller = new AbortController()
        temp = ''

        try {
            _push('user', content)

            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    uuid
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    temperature: 0.6,
                    presence_penalty: 0,
                    messages: messageList,
                }),
                signal: controller.signal,
            })

            const data = response.body
            const reader = data.getReader()
            const decoder = new TextDecoder('utf-8')
            let done = false

            textarea_container.value += 'assistant\n'
            while (!done) {
                const { value, done: readerDone } = await reader.read()
                if (value) {
                    const char = decoder.decode(value)
                    temp += char
                    textarea_container.value += char
                }
                done = readerDone
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                _push('error', `${err}`)
            }
        } finally {
            doStop()
        }

        textarea_prompt.value = ''
        doRefresh()
    }

    const doStop = () => {
        if (temp) {
            _push('assistant', temp)
            temp = ''
        }
        controller?.abort()
        loading = false
    }

    const doClean = () => {
        if (loading) {
            alert('正在请求中')
            return
        }
        _reset()
    }

    const doCopy = () => {
        const text = textarea_container.value
        if (!text) {
            return
        }

        const item = new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }) })
        navigator.clipboard.write([item])
        alert('复制成功')
    }

    const doRefresh = async () => {
        const uuid = input_uuid.value
        if (!uuid) {
            alert('无效身份令牌')
            return
        }

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    uuid
                }
            })

            const data = await response.text()
            input_balance.value = data
        } catch {
            input_balance.value = 'error'
        }
    }
}
