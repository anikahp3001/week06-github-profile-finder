import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("octocat");
  const [username, setUsername] = useState("octocat");
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!username) return;

    const controller = new AbortController();

    async function fetchUser() {
      setLoading(true);
      setError("");
      setUser(null);
      setRepos([]);

      try {
        const response = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found. Check the username.");
          }
          if (response.status === 403 || response.status === 429) {
            throw new Error(
              "GitHub API rate limit reached. Please try again later."
            );
          }
          throw new Error("Unable to fetch user. Please try again.");
        }

        const data = await response.json();
        setUser(data);

        const repoResponse = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
          { signal: controller.signal }
        );

        if (repoResponse.ok) {
          const repoData = await repoResponse.json();
          setRepos(repoData);
        }

        setHistory((previous) =>
          [data.login, ...previous.filter(
            (name) => name.toLowerCase() !== data.login.toLowerCase()
          )].slice(0, 5)
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => controller.abort();
  }, [username]);

  function handleSearch(event) {
    event.preventDefault();
    const value = input.trim();

    if (value) {
      setUsername(value);
    }
  }

  function formatNumber(number) {
    return new Intl.NumberFormat("en").format(number);
  }

  return (
    <main className={dark ? "app dark" : "app light"}>
      <header className="topbar">
        <a className="brand" href="https://github.com/">
          <span className="brand-icon">⌘</span>
          <span>DevFinder</span>
        </a>

        <button
          className="theme-toggle"
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀ Light mode" : "☾ Dark mode"}
        </button>
      </header>

      <section className="hero">
        <p className="eyebrow">THE DEVELOPER DIRECTORY</p>
        <h1>Find your next <span>inspiration.</span></h1>
        <p className="subtitle">
          Discover developers, explore their work, and learn from
          the people building the open-source world.
        </p>

        <form className="search-box" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a GitHub username..."
            aria-label="GitHub username"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <p className="hint">Try searching: octocat, torvalds, gaearon</p>
      </section>

      {history.length > 0 && (
        <section className="history">
          <span>RECENT SEARCHES</span>
          {history.map((name) => (
            <button
              key={name}
              onClick={() => {
                setInput(name);
                setUsername(name);
              }}
            >
              {name}
            </button>
          ))}
        </section>
      )}

      {loading && (
        <div className="message">
          <span className="spinner" />
          <p>Searching GitHub...</p>
        </div>
      )}

      {error && !loading && (
        <div className="message error" role="alert">
          <h3>Oops! Something went wrong.</h3>
          <p>{error}</p>
        </div>
      )}

      {user && !loading && !error && (
        <section className="profile-card">
          <div className="profile-heading">
            <img
              className="avatar"
              src={user.avatar_url}
              alt={`${user.login}'s avatar`}
            />
            <div className="identity">
              <p className="profile-label">GITHUB PROFILE</p>
              <h2>{user.name || user.login}</h2>
              <a
                className="username"
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
              >
                @{user.login} ↗
              </a>
            </div>
            <span className="online-dot" title="GitHub profile found" />
          </div>

          <p className="bio">
            {user.bio || "This developer hasn't added a bio yet."}
          </p>

          <div className="details">
            <div>
              <span>LOCATION</span>
              <strong>{user.location || "Not specified"}</strong>
            </div>
            <div>
              <span>COMPANY</span>
              <strong>{user.company || "Not specified"}</strong>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span>Repositories</span>
              <strong>{formatNumber(user.public_repos)}</strong>
            </div>
            <div className="stat">
              <span>Followers</span>
              <strong>{formatNumber(user.followers)}</strong>
            </div>
            <div className="stat">
              <span>Following</span>
              <strong>{formatNumber(user.following)}</strong>
            </div>
          </div>

          <a
            className="github-button"
            href={user.html_url}
            target="_blank"
            rel="noreferrer"
          >
            Visit GitHub Profile ↗
          </a>

          <div className="repos-section">
            <div className="section-title">
              <div>
                <p className="profile-label">OPEN SOURCE</p>
                <h3>Public repositories</h3>
              </div>
              <span className="repo-count">{repos.length} shown</span>
            </div>

            {repos.length === 0 ? (
              <p className="empty">No public repositories to display.</p>
            ) : (
              <div className="repo-list">
                {repos.slice(0, 6).map((repo) => (
                  <a
                    className="repo"
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    key={repo.id}
                  >
                    <div className="repo-top">
                      <strong>{repo.name}</strong>
                      <span>↗</span>
                    </div>
                    <p>{repo.description || "No description provided."}</p>
                    <div className="repo-meta">
                      <span>● {repo.language || "Other"}</span>
                      <span>★ {repo.stargazers_count}</span>
                      <span>⑂ {repo.forks_count}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <footer>
        <p>BUILT WITH REACT · POWERED BY THE GITHUB API</p>
        <a href="https://docs.github.com/en/rest/users/users">
          API Documentation ↗
        </a>
      </footer>
    </main>
  );
}

export default App;