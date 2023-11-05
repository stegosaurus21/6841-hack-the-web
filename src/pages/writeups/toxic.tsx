import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import Learning from "~util/Learning";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import RabbitHole from "~util/RabbitHole";
import RedHerring from "~util/RedHerring";

export const WriteupsToxic = {
    path: "toxic",
    title: "Toxic",
    chalAuth: "Froj",
    chalAuthLink: "https://app.hackthebox.com/users/156190",
    tags: [
        "Medium",
        "@PHP",
        "@Apache Server",
        "Unsafe Deserialization",
        "LFI",
        "Log Poisoning",
    ],
    description: "Converting LFI into RCE with Apache Server log poisoning.",
    reflection: () => {
        return (
            <>
                <Typography>
                    I really enjoyed this challenge - it was pretty tough, but I
                    loved the log poisoning part, since it seems like such an
                    outlandish possibility until you try it, and it just works.
                </Typography>
                <Learning title="Log poisoning is so cool">
                    It's got all the signs of a cool exploit. Subtle? Yep.
                    Powerful? Basically a server-side template injection. Widely
                    applicable? Hopefully not.
                    <br />
                    <br />
                    The fact that it can come from LFI is a very good incentive
                    to make sure that your allowed local template paths are
                    protected behind a whitelist.
                </Learning>
                <Learning
                    dev
                    title="Don't allow anything not strictly necessary"
                >
                    Honestly, this applies to all the challenges I've done, but
                    there are so many things that the user shouldn't have access
                    to that they did. Like, why can users include any local
                    file? Why can they even access the Apache Server log? Why
                    does the account running the server have access to anything
                    outside what it needs? The answer to all of these is they
                    probably shoudn't.
                </Learning>
                <Learning
                    dev
                    title="Safe defaults are the pillar of modern web security"
                >
                    If the <Inline>allow_url_include</Inline> we found had
                    defaulted to true, it would've made the server so much more
                    vulnerable. In fact, it probably would make a whole lot of
                    PHP servers vulnerable. So it's good that the default option
                    is the safe one.
                    <br />
                    <br />
                    So if you're trying to overwrite a config option, make sure
                    you know what you're doing. And if you're lucky enough to be
                    building a system that other people are going to work with,
                    please, for everyone's sake, make the defaults safe.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    I started off with the usual steps of starting the Docker
                    container and checking the technology being used. In the
                    Dockerfile we can see that it's a PHP application, which has
                    been a bit problematic previously because of my
                    unfamiliarity with syntax.
                </Typography>
                <Typography>
                    The second recon step is looking for attack vectors, which
                    we use Burp Suite for. Weirdly, though, there don't seem to
                    be any obvious ones. Nothing really accepts any input - no
                    query parameters or API calls. It's time to go back to the
                    source.
                </Typography>
                <Typography>
                    Searching for interesting security problems in the code, the
                    first thing that jumps out is the{" "}
                    <Inline>deserialize</Inline> call - which seems to be called
                    when you load the page, on the <Inline>PHPSESSID</Inline>{" "}
                    cookie. We control cookies, so that's an instance of unsafe
                    deserialisation. I know this is a vulnerability, but not
                    much about it, so I decide to do some research.
                </Typography>
                <Quote
                    sourceLink="https://owasp.org/www-community/vulnerabilities/PHP_Object_Injection"
                    sourceName="OWASP"
                >
                    The application must have a class which implements a PHP
                    magic method (such as __wakeup or __destruct) that can be
                    used to carry out malicious attacks, or to start a "POP
                    chain".
                </Quote>
                <RabbitHole title="Magic methods? POP chains?" size="Shallow">
                    <Typography>
                        Doing some research on these terms, I find that a magic
                        method is a function which 'adds magic' to a class.
                        These are effectively functions which aren't explicitly
                        called but rather when other things happen. Some
                        examples are comparator implementations, stringify
                        methods, and so on.
                    </Typography>
                    <Quote
                        sourceLink="https://www.php.net/manual/en/language.oop5.magic.php"
                        sourceName="PHP documentation"
                    >
                        Magic methods are special methods which override PHP's
                        default's action when certain actions are performed on
                        an object.
                    </Quote>
                    <Typography>
                        These methods are interesting to us as attackers because
                        they're often called all over the place, and developers
                        might not give much attention to them. We only control
                        the properties of deserialized objects, so if we can
                        find a magic method that evaluates a property, we get
                        remote code execution.
                    </Typography>
                    <Typography>
                        The most interesting magic methods are those which are
                        called without any other code - such as the{" "}
                        <Inline>__wakeup</Inline> function called afte an object
                        is created during deserialization and the{" "}
                        <Inline>__destruct</Inline> function which is called
                        when a variable goes out of scope.
                    </Typography>
                    <Typography>
                        A POP chain is an exploit chain which uses several of
                        these functions across different objects in the codebase
                        to achieve code execution.
                    </Typography>
                </RabbitHole>
                <Typography>
                    Looking around the codebase, it's pretty easy to find our
                    class.
                </Typography>
                <MultiLine language="php">{`class PageModel
{
    public $file;

    public function __destruct() 
    {
        include($this->file);
    }
}`}</MultiLine>
                <Typography>
                    Basically, this will render whatever file I give it as a PHP
                    file, which itself is just a template written in PHP. Let's
                    try a simple injection by making it render the{" "}
                    <Inline>production.js</Inline> file. The default page being
                    rendered is <Inline>/www/index.html</Inline>, so to do this,
                    we use the path{" "}
                    <Inline>/www/static/js/production.js</Inline>
                </Typography>
                <Typography>
                    Funnily, I don't have a PHP installation on my actual
                    computer, so I'm going to use the server itself to generate
                    my payloads by adding the following to the source code.
                </Typography>
                <MultiLine language="php">{`$x = new PageModel;
$x->file = '/www/static/js/production.js';
print(base64_encode(serialize($x)));`}</MultiLine>
                <Typography>
                    This will print my payload at the top of the loaded page,
                    which is an extremely janky way of doing things but it
                    works. Thankfully PHP compiles quick, so restarting the
                    Docker container doesn't take too long. Was there a better
                    way to do this? Yes, probably. I probably should've at least
                    read it from a query parameter rather than rebuilding the
                    container every time. But oh well.
                </Typography>
                <Typography>
                    Once we have this payload we then copy the output into the{" "}
                    <Inline>PHPSESSID</Inline> cookie get back the source file
                    as we expect.
                </Typography>
                <Typography>
                    Great, now all we have to do is include the flag, right?
                    Nope, that doesn't work, since the{" "}
                    <Inline>entrypoint.sh</Inline> script randomises the flag
                    name when the container starts. While we could try and brute
                    force this, it would take ages and be against the spirit of
                    the challenge. Let's see if we can get remote code execution
                    instead.
                </Typography>
                <MultiLine language="bash">
                    {`# Generate random flag filename
mv /flag /flag_\`cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 5 | head -n 1\``}
                </MultiLine>
                <RedHerring title="Remote file inclusion" size="Small">
                    <Typography>
                        My first try at getting RCE was by attempting to include
                        a remote file. The idea was that the{" "}
                        <Inline>include</Inline> call from before might be able
                        to include a remote file, which would give me code
                        execution.
                    </Typography>
                    <Typography>
                        Unfortunately, PHP sensibly disables remote file
                        inclusion by default, and in my quick test of trying to
                        include <Inline>https://google.com</Inline>, it didn't
                        work.
                    </Typography>
                    <Typography>
                        I also tried several other protocols listed in{" "}
                        <Link
                            href="https://www.php.net/manual/en/wrappers.php"
                            target="_blank"
                        >
                            PHP's documentation
                        </Link>
                        , but by default only local files are supported as
                        include paths. This is good, but bad for me. The
                        relevant configuration option is{" "}
                        <Inline>allow_url_include</Inline>, which defaults to
                        false.
                    </Typography>
                </RedHerring>
                <Typography>
                    Being a bit stuck at this point, I decide to look up PHP LFI
                    to RCE, and something interesting that pops up is log
                    poisoning.
                </Typography>
                <Quote
                    sourceLink="https://book.hacktricks.xyz/pentesting-web/file-inclusion#via-apache-nginx-log-file"
                    sourceName="HackTricks"
                >
                    {`If the Apache or Nginx server is vulnerable to LFI inside the include function you could try to access to /var/log/apache2/access.log or /var/log/nginx/access.log, set inside the user agent or inside a GET parameter a php shell like <?php system($_GET['c']); ?> and include that file`}
                </Quote>
                <Typography>
                    Worth a shot. First, we check if the server log can actually
                    be included by setting the LFI path to{" "}
                    <Inline>/var/log/nginx/access.log</Inline>. This works fine,
                    so we try and inject a simple RCE payload.
                </Typography>
                <MultiLine noNumber>
                    {`GET / HTTP/1.1
Host: localhost:1337
User-Agent: <?php print \`ls\` ?>
...`}
                </MultiLine>
                <Typography>
                    Dang, that just works. At this stage, we just{" "}
                    <Inline>cat</Inline> our flag and we're done!
                </Typography>
            </>
        );
    },
};
