import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import Learning from "~util/Learning";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";

export const WriteupsApache = {
    path: "apache",
    title: "ApacheBlaze",
    chalAuth: "dhmosfunk",
    chalAuthLink: "https://app.hackthebox.com/users/78776",
    tags: ["Easy", "@Apache Server", "Request Smuggling"],
    description:
        "Exploiting a severity 9.8 HTTP request smuggling vulnerability in Apache Server.",
    reflection: () => {
        return (
            <>
                <Typography>
                    This was the first challenge I completed, and as such I had
                    nothing but my web development experience going into it. My
                    main learnings are summarised below.
                </Typography>
                <Learning title="Web challenges are hard">
                    Usually in web development problems aren't too hard to fix.
                    Most of the time the problems I make are my own, or if not,
                    someone on StackOverflow has had it already.
                    <br />
                    <br />
                    With this though, I can easily spend half an hour staring at
                    some code that could maybe be broken only for it to be
                    perfectly fine. Or an hour trying to learn what in the world
                    Apache Server is.
                    <br />
                    <br />
                    Because of this, before I get more experienced, I need to
                    approach web challenges with an exploratory mindset, and
                    accept that it might take a while! Thankfully it's a pretty
                    fun process.
                </Learning>
                <Learning title="CVEs are your friend">
                    I'm very lucky that the first CVE exploit challenge I come
                    across was as simple as this. I spent a long time in the
                    challenge looking through the source code looking for
                    vulnerabilities, when actually the exploit was in the
                    technology stack itself.
                    <br />
                    If the source code had been much longer, with more red
                    herrings, I would have probably wasted a lot of time. For
                    future challenges, I plan to check for CVEs much earlier on,
                    since it doesn't take much time.
                </Learning>
                <Learning dev title="Update your tech stack!">
                    The vulnerability here came about due to an outdated library
                    - so the obvious lesson for developers here is to make sure
                    that your libraries are up to date!
                    <br />
                    <br />
                    The main package manager I use, npm, is helpful enough to
                    tell you what CVEs are known for your installed packages
                    when you install or update them.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    I first have a read through of the source code. The app uses
                    Python's Flask library for its backend, which is something I
                    have some experience in. Based on the source snippet, it
                    seems like we want to send a request to the backend root
                    address with <Inline>click_topia</Inline> as the game and
                    <Inline>dev.apacheblaze.local</Inline> as the
                    X-Forwarded-Host.
                </Typography>

                <MultiLine language="py">{`@app.route('/', methods=['GET'])
# ...
if request.headers.get('X-Forwarded-Host') == 'dev.apacheblaze.local':
    return jsonify({
        'message': f'{app.config["FLAG"]}'
    }), 200`}</MultiLine>

                <Typography>
                    The challenge comes with a Dockerfile to run the app
                    locally, which will be a very useful resource for testing.
                    So I spin that up with the <Inline>build_docker.sh</Inline>{" "}
                    script, then write a quick script to try out the simplest
                    possible exploit by passing the required X-Forwarded-Host
                    header.
                </Typography>
                <Typography>
                    Nope - the response just gives me the regular game page.
                    This makes sense, since we're basically just getting the
                    website itself. But the actual frontend needs to be able to
                    call the API somehow, and if it can do it, I should be able
                    to as well (since the frontend is clientside). Time to dig
                    through the source again.
                </Typography>
                <Typography>
                    Looks like it's calling the <Inline>/api/games</Inline>{" "}
                    route, so let's try that. I thought it was weird how the
                    Flask app picks this up despite not listening at that route
                    - time for some more looking around. Starting at the top
                    with the Dockerfile, I see that there's some kind of HTTP
                    proxy being configured by this <Inline>httpd.conf</Inline>{" "}
                    file. I haven't worked with this much, but a quick Google
                    shows its part of Apache Server.
                </Typography>
                <MultiLine noNumber>
                    {`RewriteRule "^/api/games/(.*)"
"http://127.0.0.1:8080/?game=$1" [P] ProxyPassReverse "/"
"http://127.0.0.1:8080:/api/games/"`}
                </MultiLine>
                <Typography>
                    These lines from the config file confirm the actual route I
                    should be calling:{" "}
                    <Inline>http://localhost:1337/api/games/click_topia</Inline>{" "}
                    - which gets redirected by the reverse proxy to call the
                    internal flask route.
                </Typography>
                <Typography>
                    This doesn't seem to work though, and gives me the error
                    message: “This game is currently available only from
                    dev.apacheblaze.local.” I set my headers though! After
                    scratching my head for a while, I decided that the best way
                    to find the issue was by adding a print statement to the
                    server code to print the header it receives and check that
                    I'm sending it correctly - luckily this is very possible
                    since I have source code access.
                </Typography>

                <Inline>
                    X-Forwarded-Host: dev.apacheblaze.local, localhost:1337,
                    127.0.0.1:8080
                </Inline>

                <Typography>
                    Aha. While the proxy is being nice and passing our (fake)
                    header to the backend, it's also adding its own annoying
                    little things to our header, revealing that we're passing
                    through the proxy and not coming from the internal network.
                    I didn't know much about bypassing web proxies, so I decided
                    to do some research - starting with CVE hunting. CVEs are
                    Common Vulnerabilities and Exploits, and publicly reveal a
                    list of security issues in frequently used applications.
                    While these are generally fixed in current versions, they
                    can give us easy hints about what to try if we're looking at
                    older versions of software. We look at the Dockerfile and
                    requirements.txt to see what versions of software we're
                    installing.
                </Typography>

                <MultiLine noNumber>
                    {`RUN wget https://archive.apache.org/dist/httpd/httpd-2.4.55.tar.gz && tar -xvf httpd-2.4.55.tar.gz 
Flask==2.3.3
uwsgi==2.0.22`}
                </MultiLine>

                <Typography>
                    Checking the Flask version, it seems pretty recent, with no
                    apparent vulnerabilities. But the Apache version 2.4.55 is
                    pretty suspicious, and one pretty interesting looking CVE
                    comes up - with a severity of 9.8, which is apparently
                    critical! From the description:
                </Typography>
                <Quote
                    sourceName="NIST"
                    sourceLink="https://nvd.nist.gov/vuln/detail/CVE-2023-25690"
                >
                    Some mod_proxy configurations on Apache HTTP Server versions
                    2.4.0 through 2.4.55 allow a HTTP Request Smuggling attack…
                    For example, something like: RewriteEngine on RewriteRule
                    “^/here/(.*)” “http://example.com:8080/elsewhere?$1”; [P]
                    ProxyPassReverse /here/ http://example.com:8080/
                </Quote>

                <Typography>
                    That looks <strong>way</strong> too close to what we've got
                    for it to be a coincidence.
                </Typography>
                <Typography>
                    So now I have my vulnerability, it's time to try and figure
                    out how to exploit it. While I've used HTTP about a million
                    times, I'm still very unfamiliar with how it's actually
                    parsed and handled by web servers, so it's time for some
                    research.
                </Typography>
                <Typography>
                    A quick Google of the CVE reveals{" "}
                    <Link
                        href="https://github.com/dhmosfunk/CVE-2023-25690-POC"
                        target="_blank"
                    >
                        this
                    </Link>{" "}
                    repo which shows a proof of concept of this exploit. And you
                    know what that means - script kiddie time! Copying the proof
                    of concept payload into our own function, we get something
                    along the lines of the following:
                </Typography>

                <Inline>
                    http://localhost:1337/api/games/click_topia%20HTTP/1.1%0d%0aHost:%20localhost%0d%0a%0d%0aGET%20/SMUGGLED
                    HTTP/1.1
                </Inline>

                <Typography>
                    After submitting this request, I get two requests showing up
                    in the server log, all but confirming I've managed to
                    smuggle a HTTP request (my first ever)! Another interesting
                    thing I notice is that the X-Forwarded-Host is now{" "}
                    <Inline>localhost</Inline> which is exactly what was entered
                    as the host in the proof of concept. Surely changing this to
                    the <Inline>dev.apacheblaze.local</Inline> couldn't just be
                    it. But amazingly it was, and I managed to get the test
                    flag. Applying the same thing to the remote instance caused
                    no dramas, and I managed to solve the challenge!
                </Typography>
            </>
        );
    },
};
