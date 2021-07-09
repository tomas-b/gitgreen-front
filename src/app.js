import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import ReactDOM from "react-dom";
import axios from "axios";
import queryString from "query-string";
import "babel-polyfill"; // polyfill async/await
import "./style.css";

const App = (props) => {
  let [calendar, setCalendar] = useState(null);
  let [user, setUser] = useState(null);

  const queryUser = async (user) => {
    setUser(user);
    let res = await axios({
      url: "https://wrapapi.com/use/tomas-b/github/grid/latest",
      method: "post",
      data: {
        wrapAPIKey: "eF1EOVpNlFuSQfuIqDmrw2Fp1ZT3LZqy",
        username: user,
      },
    });

    let newfield = res.data.map((day) => {
      day.added = 0;
      return day;
    });

    setCalendar(newfield);
  };

  const generateCommits = (calendar) => {
    let top = 0;
    for (let day of calendar) {
      if (+day.count > top) {
        top = day.count;
      }
    }

    let commits = [];
    let unit = Math.floor(top * 0.25); // bad aprox.

    for (let day of calendar) {
      if (day.added > 0) {
        let cnt = day.added * unit;
        commits.push([day.date, cnt]);
      }
    }

    return commits;
  };

  const generateAndPush = () => {
    window.localStorage.setItem("calendar", JSON.stringify(calendar));
    window.localStorage.setItem("user", JSON.stringify(user));
    window.localStorage.setItem(
      "commits",
      JSON.stringify(generateCommits(calendar))
    );
    window.location =
      "https://github.com/login/oauth/authorize?client_id=0d5dbf7a901181653dd5&scope=public_repo";
  };

  return (
    <div id="layout">
      <SearchBox queryUser={queryUser} user={user} />
      <Calendar calendar={calendar} setCalendar={setCalendar} user={user} />
      <Switch>
        <Route path="/callback">
          <GithubCB setCalendar={setCalendar} setUser={setUser} />
        </Route>
        <Route path="/">
          <div id="clickInfo">
            click - draw <br />
            click + shift - delete
          </div>
          {user && (
            <div className="button" onClick={generateAndPush}>
              <GithubSVG />
              Create Commits & Push 'em!
            </div>
          )}
        </Route>
      </Switch>
    </div>
  );
};

const GithubCB = ({ setCalendar, setUser }) => {
  let [commits, setCommits] = useState(window.localStorage.getItem("commits"));
  const { code } = queryString.parse(location.search);

  useEffect(() => {
    setCalendar(JSON.parse(window.localStorage.getItem("calendar")))
    setUser(JSON.parse(window.localStorage.getItem("user")));
  }, []);

  let url = `https://gitgreen.herokuapp.com/cb/${code}?commmits=${commits}`;
  return (
    <>
      <a href={url}>{url}</a>
    </>
  );
};

const SearchBox = ({user, queryUser}) => {

    let [userInput, setUserInput] = useState(user)

  useEffect(() => {
    if (userInput !== null) {
      const endOfTypingDelay = setTimeout(() => {
        queryUser(userInput);
      }, 500);
      return () => clearTimeout(endOfTypingDelay);
    }
  }, [userInput]);

  return (
    <div id="searchbox">
      <span>@</span>
      <input
        type="text"
        placeholder="your github username..."
        onChange={(e) => setUserInput(e.target.value)}
        defaultValue={user}
      />
    </div>
  );
};

const Calendar = (props) => {
  let [tool, setTool] = useState("add");
  let [mousedown, setMousedown] = useState(false);

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key == "Shift") setTool("remove");
    });
    window.addEventListener("keyup", (e) => {
      if (e.key == "Shift") setTool("add");
    });
  }, []);

  const drawBox = (i) => {
    if (!tool) return;
    if (!mousedown) return;
    let current = +props.calendar[i].level + props.calendar[i].added;
    if (tool == "add" && current < 4) props.calendar[i].added += 1;
    if (tool == "remove" && props.calendar[i].added > 0)
      props.calendar[i].added -= 1;
    props.setCalendar([...props.calendar]);
  };

  const clickBox = (i) => {
    let current = +props.calendar[i].level + props.calendar[i].added;
    if (current < 4) {
      props.calendar[i].added += 1;
    } else {
      props.calendar[i].added = 0;
    }
    props.setCalendar([...props.calendar]);
  };

  if (props.calendar == null) {
    // is props.user !== null then ajax request waiting
    console.log(props);
    return (
      <>
        <div
          className={`git-grid ${
            props?.user !== null ? "git-loading" : "git-idle"
          }`}
        >
          {Array(371)
            .fill(null)
            .map((day, i) => (
              <div key={i} className={`box`}></div>
            ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="git-grid"
        onMouseDown={() => setMousedown(true)}
        onMouseUp={() => setMousedown(false)}
      >
        {props.calendar.map((day, i) => (
          <div
            key={day.date}
            onClick={() => {
              clickBox(i);
            }}
            onMouseMove={() => {
              drawBox(i);
            }}
            className={`box l${+day.level + day.added}`}
          ></div>
        ))}
      </div>
    </>
  );
};

const GithubSVG = () => (
  <svg
    height="30"
    width="30"
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>GitHub</title>
    <path
      fill="white"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  </svg>
);

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.querySelector("#root")
);
