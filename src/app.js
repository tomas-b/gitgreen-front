import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import 'babel-polyfill' // polyfill async/await
import './style.css'

const App = props => {

    let [calendar, setCalendar] = useState(null)
    let [user, setUser] = useState(null)
    let [commitsCommand, setCommitsCommand] = useState('')
    let [origin, setOrigin] = useState('')

    const queryUser = async user => {
        setCalendar(null)
        let res = await fetch(`https://gitgreen.herokuapp.com/user/${user}`)
        let newfield = (await res.json()).map(day=>{ day.added = 0; return day })
        setUser(user)
        setCalendar(newfield)
        setOrigin(`https://github.com/${user}/greens.git`)
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

    return <div id='layout'>
            <SearchBox queryUser={queryUser}/>
            <Calendar calendar={calendar} setCalendar={setCalendar} user={user}/>
            <div id='clickInfo'>
            click - draw <br/>
            click + shift - delete
            </div>
            <div id='generator'>
                <svg class="octicon octicon-repo UnderlineNav-octicon hide-sm" height="16" viewBox="0 0 16 16" version="1.1" width="16" aria-hidden="true"><path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path></svg>
                REMOTE: <input defaultValue={origin} onChange={e=>setOrigin(e.target.value)}/>
                <button onClick={generateCommits}>win</button>
                <button onClick={generateCommits}>linux</button>
                <textarea readOnly value={commitsCommand}></textarea>
            </div>
    </div>

}

const SearchBox = props => {

    let [user, setUser] = useState(null)

    useEffect(()=>{
        if(user!==null) {
            const endOfTypingDelay = setTimeout(()=>{props.queryUser(user)}, 500)
            return () => clearTimeout(endOfTypingDelay)
        }
    },[user])

    return <div id='searchbox'>
        <span>@</span>
        <input type='text' placeholder='your github username...' onChange={e=>setUser(e.target.value)} />
    </div>
}

const Calendar = props => {

    let [tool, setTool] = useState('add')
    let [mousedown, setMousedown] = useState(false)

    useEffect(()=>{
        window.addEventListener('keydown', e=>{ if(e.key == 'Shift') setTool('remove') })
        window.addEventListener('keyup', e=>{ if(e.key == 'Shift') setTool('add') })
    },[])

    const drawBox = i => {
        if(!tool) return;
        if(!mousedown) return;
        let current = + props.calendar[i].level + props.calendar[i].added;
        if(tool == 'add' && current < 4) props.calendar[i].added += 1;
        if(tool == 'remove' && props.calendar[i].added > 0) props.calendar[i].added -= 1;
        props.setCalendar([...props.calendar])
    }

    const clickBox = i => {
        let current = + props.calendar[i].level + props.calendar[i].added;
        if(current < 4) {
            props.calendar[i].added += 1;
        } else {
            props.calendar[i].added = 0;
        }
        props.setCalendar([...props.calendar])
    }


    if (props.calendar == null) {
        // is props.user !== null then ajax request waiting
        return <>
            <div className='git-grid'>
            {Array(371).fill(null).map( (day, i) =>
                <div key={i} className={`box`}></div>
            )}
            </div>
            </>
    }

    return <>
        <div className='git-grid' onMouseDown={()=>setMousedown(true)} onMouseUp={()=>setMousedown(false)}>
        {props.calendar.map( (day, i) =>
            <div key={day.date} onClick={()=>{clickBox(i)}} onMouseMove={()=>{drawBox(i)}} className={`box l${+day.level+day.added}`}></div>
        )}
        </div>
    </>
}

ReactDOM.render(<App/>, document.querySelector('#root'))