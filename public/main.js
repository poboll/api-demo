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

    textarea_prompt.value = "用小学知识做题，计算过程不要带单位，式子的计算结果带单位且用括号括起来；所有括号用中文格式括号；不要出现空格；乘法用×；不要设未知数、不用方程。按格式回答：【分析】本题考查α，解题思路是β。【解答】解：γ。答：\n以下是问题：\n";

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
        textarea_container.value = ''
    }

    const _render = () => {
        //textarea_prompt.value = ''
        textarea_container.value = ''
        //message.content = message.content.replace("(", "（").replace(")", "）");
        // 如果消息中包含一行没有信息的行，则删除行
        //message.content = message.content.split('\n').filter(line => line.trim() !== '').join('\n');
        // 删除消息中的空格
        //message.content = message.content.replaceAll(" ", "");
        //message.content = message.content.replace("【分析】", "【分析】\n");
        //message.content = message.content.replace("【分析】", "【解答】\n");
        //message.content = message.content.replace("答：", "\n答：");
        messageList.forEach((message) => {
            //textarea_container.value += message.role
            //textarea_container.value += '\n'
            if (message.role === 'assistant') {
                message.content = message.content
                    .replace(/【分析】/g, "【分析】\n")
                    .replace(/【解答】/g, "\n【解答】\n")
                    .replace(/答：/g, "\n答：");
                textarea_container.value += message.content
                textarea_container.value += '\n'
            }
        })
        textarea_container.value = textarea_container.value
            .replace("(", "（")
            .replace(")", "）")
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n')
            .replaceAll("", "")
            .replace("*", "×");

    }

    const doRequest = async () => {
        if (loading) {
            alert('正在请求中')
            return
        }

        const uuid = "86f1a3a1-09ce-455f-adf2-4e635b78e3cb"

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
            textarea_container.value = ''
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

            //textarea_container.value += 'assistant\n'
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

        //textarea_prompt.value = ''
        messageList = []
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
        textarea_container.value = ''
        _reset()
    }

    const doCopy = () => {
        const text = textarea_container.value;
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log('Text copied to clipboard');
    }

    const doRefresh = async () => {
        const uuid = "86f1a3a1-09ce-455f-adf2-4e635b78e3cb"
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
