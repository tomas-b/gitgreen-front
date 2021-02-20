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

    return <div className='layout'>
            <SearchBox queryUser={queryUser}/>
            <Calendar calendar={calendar} setCalendar={setCalendar} user={user}/>
            <div className='clickInfo'>
            click - draw <br/>
            click + shift - delete
            </div>
            <div className='generator'>
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