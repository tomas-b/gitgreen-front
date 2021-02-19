import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import 'babel-polyfill' // polyfill async/await
import './style.css'

const Calendar = props => {

}

const App = props => {

    let [calendar, setCalendar] = useState(null)
    let [tool, setTool] = useState('add')
    let [mousedown, setMousedown] = useState(false)
    let [commitsCommand, setCommitsCommand] = useState('')
    let [origin, setOrigin] = useState('https://github.com/<username>/<repo>')

    useEffect(async ()=>{
        let res = await fetch('https://gitgreen.herokuapp.com/user/tomas-b')
        let newfield = (await res.json()).map(day=>{ day.added = 0; return day })
        setCalendar(newfield)
        window.addEventListener('keydown', e=>{ if(e.key == 'Shift') setTool('remove') })
        window.addEventListener('keyup', e=>{ if(e.key == 'Shift') setTool('add') })
    }, [])

    if (!calendar) return <b>loadin'</b>;

    const drawBox = i => {
        if(!tool) return;
        if(!mousedown) return;
        let current = + calendar[i].level + calendar[i].added;
        if(tool == 'add' && current < 4) calendar[i].added += 1;
        if(tool == 'remove' && calendar[i].added > 0) calendar[i].added -= 1;
        setCalendar([...calendar])
    }

    const clickBox = i => {
        let current = + calendar[i].level + calendar[i].added;
        if(current < 4) {
            calendar[i].added += 1;
        } else {
            calendar[i].added = 0;
        }
        setCalendar([...calendar])
    }

    const pickTool = t => {
        if( tool == t ) {
            setTool(false);
        } else {
            setTool(t)
        }
    }

    const generateCommits = () => {

        let top = 0;
        for(let day of calendar) {
            if(+day.count > top) {
                top = day.count
                console.log(top)
            }
        }

        let commits = [];
        let unit = Math.floor(top*.25) // bad aprox.

        for(let day of calendar) {
            if(day.added > 0) {
                let cnt = day.added*unit;
                commits.push(`echo ${Math.random()} > ${day.date}.txt`)
                commits.push(`git add ${day.date}.txt`)
                while(cnt>0) {
                    commits.push(`echo ${Math.random()} > ${day.date}.txt`)
                    commits.push(`git commit -m '.' --date='${day.date}_13-37-${cnt}' -a`);
                    cnt--;
                }
            }
        }

        let commands = [
            ['mkdir dir && cd dir'],
            ['git init'],
            ... commits, 
            [`git remote add origin ${origin}`],
            [`git push origin master`],
            [``]
        ]

        setCommitsCommand(commands.join('\n'))
    }

    return <>
        <div className='git-grid' onMouseDown={()=>setMousedown(true)} onMouseUp={()=>setMousedown(false)}>
        {calendar.map( (day, i) =>
            <div key={day.date} onClick={()=>{clickBox(i)}} onMouseMove={()=>{drawBox(i)}} className={`box l${+day.level+day.added}`}></div>
        )}
        </div>
        <hr/>
        <button onClick={()=>pickTool('add')} className={tool=='add'?'active':''}>add++</button>
        <button onClick={()=>pickTool('remove')} className={tool=='remove'?'active':''}>remove-</button>
        <hr/>
        <input defaultValue={origin} onChange={e=>setOrigin(e.target.value)}></input>
        <button onClick={generateCommits}>Generate!</button>
        <br/>
        <textarea readOnly value={commitsCommand}></textarea>
    </>

}

ReactDOM.render(<App/>, document.querySelector('#root'))