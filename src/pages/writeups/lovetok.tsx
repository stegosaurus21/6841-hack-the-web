import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import Quote from "~util/Quote";
import love1 from "~img/love1.png";
import love2 from "~img/love2.png";
import Learning from "~util/Learning";
import SourcedImage from "~util/SourcedImage";

export const WriteupsLove = {
    path: "love",
    title: "LoveTok",
    chalAuth: "makelaris",
    chalAuthLink: "https://app.hackthebox.com/users/107",
    tags: ["Medium", "@PHP", "Unsafe Eval"],
    description: "A deceptively simple and extremely painful PHP eval exploit.",
    reflection: () => {
        return (
            <>
                <Typography>
                    I didn't particularly like this challenge, because I could
                    pretty much spot the vulnerability immediately, but the
                    actual issue was figuring out how to implement it.
                    Nonetheless, I still had an interesting learning from a web
                    developer's perspective.
                </Typography>
                <Learning dev title="Don't roll your own security">
                    The issue in this application was that we're using a
                    function which is obviously not designed as a security
                    feature, as a security feature. The{" "}
                    <Inline>addslashes</Inline> function is just one example of
                    this, and we've seen others, like regexes and blacklists.
                    <br />
                    <br />
                    Generally, if you are about to use user input in a way
                    that's potentially unsafe, probably someone has done
                    something similar before, and has made a library to protect
                    from dangerous use cases. Probably if it's been around a
                    while it's better than anything you can think up in your 5
                    minute attention span.
                    <br />
                    <br />
                    Probably use that instead.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    After spinning up the Docker container, I look at the
                    dependencies in the Dockerfile.
                </Typography>
                <Inline>RUN apt update && apt install -y php7.4-fpm</Inline>
                <Typography>
                    Hmm, PHP. I haven't had much experience with it (something
                    that will quickly become apparent) - but at least version
                    7.4 seems relatively recent, with no obvious CVEs.
                </Typography>
                <SourcedImage
                    src={love2}
                    caption="How the application usually looks."
                    height="30vh"
                />
                <SourcedImage
                    src={love1}
                    caption="We can inject input into the date format."
                    height="40vh"
                />
                <Typography>
                    Next - what are our input methods? There isn't anything
                    obvious, but checking out the source code reveals that we
                    can change the <Inline>format</Inline> query parameter,
                    which gets stored as the format for presenting the date.
                    And... oh.
                </Typography>
                <Inline language="php">
                    {`eval('$time = date("' . $this->format . '", strtotime("' . $this->prediction . '"));');`}
                </Inline>
                <Typography>
                    Well, that's the most obvious vulnerability I've seen in a
                    while. We basically have a free eval on whatever we want.
                    The only issue is the sanitisation step:
                </Typography>
                <Inline language="php">
                    {`$this->format = addslashes($format);`}
                </Inline>
                <Typography>
                    Research time - what does this addslashes function do?
                </Typography>
                <Quote
                    sourceLink="https://www.php.net/manual/en/function.addslashes.php"
                    sourceName="PHP documentation"
                >
                    Returns a string with backslashes added before characters
                    that need to be escaped. These characters are: single quote
                    ('), double quote ("), backslash (\), NUL (the NUL byte).
                </Quote>
                <Typography>
                    Surely that's escapable. There's also the issue that we're
                    in single quotes in the eval.
                </Typography>
                <Typography>
                    What I did next was the most abysmal payload bash I did in
                    this entire project. I ended up tunnel-visioning a lot in
                    this process and didn't write everything I probably
                    should've, but here's what I do remember trying.
                </Typography>
                <Typography>
                    Firstly, we need to be able to evade the{" "}
                    <Inline>addslashes</Inline> call. One way I found to do this
                    was using another query parameter - for example, we could
                    have an additional query parameter <Inline>q</Inline> which
                    was just set to a quote, then whenever we wanted to use a
                    quote, replace it with <Inline>{`\${_GET[q]}`}</Inline>{" "}
                    which would evaluate to a quote. My first few attempts
                    looked something along of this.
                </Typography>
                <Inline>{`r\${_GET[q]}) + \${_GET[q]}hi\${\_GET[q]} + date(\${\_GET[q]}r`}</Inline>
                <Typography>
                    I was hoping that when added into the expression, this would
                    look something like:
                </Typography>
                <Inline language="php">
                    {`eval('$time = date("r") + "hi" + date("r", strtotime("' . $this->prediction . '"));');`}
                </Inline>
                <Typography>
                    If this worked, it would allow me to inject other things in
                    place of the "hi", which was just a proof of concept.
                </Typography>
                <Typography>
                    Sadly, this didn't work, and in retrospect I figured out
                    that this was because the <Inline>{`\${_GET[q]}`}</Inline>{" "}
                    expressions weren't parsed in the eval, meaning that the
                    actual statement would have been...
                </Typography>
                <Inline language="php">
                    {`eval('$time = date("r\${_GET[q]}) + \${_GET[q]})hi\${_GET[q]}) + date(\${_GET[q]})r", strtotime("' . $this->prediction . '"));');`}
                </Inline>
                <Typography>
                    ...which of course would break. So we need either an{" "}
                    <Inline>echo</Inline> function or <Inline>eval</Inline>{" "}
                    function to expand the substitution before it can be
                    inserted.
                </Typography>
                <Typography>
                    At this stage I also realised that rather than trying to
                    insert quotes only, I might as well have my entire payload
                    in a separate parameter to avoid the addslashes function.
                    This made my payload look something like:
                </Typography>
                <Inline>{`?format=$_GET[1]&1=<actual payload>`}</Inline>
                <Typography>
                    The final couple of pieces of the puzzle were PHP backticks,
                    which will evaluate their contents in the context of a
                    system shell and return the result, and{" "}
                    <Link
                        href="https://www.php.net/manual/en/language.types.string.php#language.types.string.parsing.complex"
                        target="_blank"
                    >
                        complex string substitutions
                    </Link>
                    , giving me the final payload (after an hour of tinkering -
                    it's really annoying to debug when you know nothing about
                    the language):
                </Typography>
                <Inline>{`?format={\${eval(\$_GET[1])}}&1=print \`ls\`;`}</Inline>
                <Typography>
                    Essentially, when this is evaluated, the first part{" "}
                    <Inline>{`\${eval(\$_GET[1])}}`}</Inline> evaluates the
                    second part <Inline>print `ls`</Inline>, which directly
                    prints the result of the <Inline>ls</Inline> command to the
                    returned webpage.
                </Typography>
                <Typography>
                    This gives us our remote code execution, which easily gets
                    us the flag.
                </Typography>
            </>
        );
    },
};
