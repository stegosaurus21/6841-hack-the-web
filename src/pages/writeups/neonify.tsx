import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import SourcedImage from "~util/SourcedImage";
import RabbitHole from "~util/RabbitHole";
import RedHerring from "~util/RedHerring";
import easter1 from "~img/easter1.png";
import Learning from "~util/Learning";

export const WriteupsNeon = {
    path: "neon",
    title: "Neonify",
    chalAuth: "Codehead",
    chalAuthLink: "https://app.hackthebox.com/users/129959",
    tags: ["Easy", "@Ruby", "SSTI"],
    description:
        "Learning to use Burp Suite and using regex evasion pull off a neat SSTI.",
    reflection: () => {
        return (
            <>
                <Typography>
                    While this challenge was fairly simple, I still felt like I
                    learnt a lot by experimeting with a new tool - and I'm glad
                    that I did.
                </Typography>
                <Learning title="Use the right tools">
                    Honestly, I'm not sure how I managed without Burp Suite
                    before. It makes repeating API requests so much easier -
                    rather than having to open the website, record the network,
                    find the request, copy it over to Postman and just generally
                    struggle with basic things, in Burp suite I can pretty much
                    do that same thing in 5 inputs.
                    <br />
                    <br />
                    In general, the more security related stuff I do, the more I
                    realise the importance of knowing the tools of the trade -
                    from Ghidra to fuzzers to Burp Suite!
                </Learning>
                <Learning
                    dev
                    title="Security here is not an excuse for insecurity there"
                >
                    If code could talk, this web app would be saying something
                    along the lines of "well, since I've checked the input
                    against a regex, I'm fine to evaluate it as a template".
                    <br />
                    <br />
                    No, you're not. Just because you've considered security in
                    one place doesn't give you a free pass to do dodgy stuff
                    like evaluate user input as a template or{" "}
                    <Inline>eval</Inline>'ing it.
                    <br />
                    <br />
                    To be fair, I'm probably guilty of having thought something
                    like this before, but generally, if input isn't validated
                    against something like a whitelist, we probably shouldn't be
                    doing anything risky with it.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    First things first, looking at the app. This time we'll
                    start by looking for attack vectors for a change. So I can
                    enter some text and it makes it neon. Fair enough, so we can
                    supply some text. Time to look at the source.
                </Typography>
                <Typography>
                    Oh boy it's Ruby. Another language I have no idea about.
                    Well, let's try and figure out the chain of events when we
                    press submit. The Edge network tab is showing that we're
                    sending a POST request to the same url, with a JSON payload{" "}
                    <Inline>{`neon: <our string>`}</Inline>. It seems like the
                    server then responds with the webpage, where the string is
                    substituted. So the page is being rendered serverside -
                    presumably we're looking for some sort of RCE.
                </Typography>
                <Typography>
                    Using Edge to intercept network requests seems pretty
                    amateur, and I've seen people using Burp Suite to do this
                    sort of thing. It might be fun to try using that for once.
                    While it downloads, time to check out this ERB thing in the
                    Ruby source. As is customary, we'll also check if the
                    Dockerfile is pulling some specific vulnerable version.
                    Nope, no special versions in the Dockerfile or Gemfile.
                </Typography>
                <Typography>
                    Ah, ERB is a templating library. We've seen a fair few of
                    those go wrong already, so let's do a deeper dive into the
                    docs.
                </Typography>
                <Quote
                    sourceName="Puppet (weirdly, not official Ruby documentation)"
                    sourceLink="https://www.puppet.com/docs/puppet/5.5/lang_template_erb.html"
                >
                    {`An expression-printing tag inserts values into the output. It starts with an opening tag delimiter and equals sign (<%=) and ends with a closing tag delimiter (%>). It must contain a snippet of Ruby code that resolves to a value; if the value isn't a string, it will be automatically converted to a string using its to_s method.`}
                </Quote>
                <Typography>
                    Result 1 is{" "}
                    <Link
                        href="https://trustedsec.com/blog/rubyerb-template-injection"
                        target="_blank"
                    >
                        this blog
                    </Link>
                    , which gives us a useful starting point. Let's first see if
                    we can evaluate an expression.
                </Typography>
                <Typography>
                    Ooh, but wait - Burp Suite is ready! I've watched a friend
                    use this, so I know roughly what it looks like. We first
                    open up the browser, then turn intercept on to see the
                    requests that the page is making. I easily intercept the
                    POST request we saw earlier, and we can now send that to the
                    Repeater to start cooking up some payloads.
                </Typography>
                <Typography>
                    Let's start with the basic expression evaluation{" "}
                    <Inline>{`<%= 7*7 %>`}</Inline>. We HTML encode this to make
                    sure the server knows what's going on, and... 'Malicious
                    Input Detected'. Hmm, what's this actually checking for?
                    Let's check the source.
                </Typography>
                <MultiLine language="ruby">
                    {`if params[:neon] =~ /^[0-9a-z ]+$/i
    @neon = ERB.new(params[:neon]).result(binding)
    @plain = params[:neon]
else
    @neon = "Malicious Input Detected"
end`}
                </MultiLine>
                <Typography>
                    Ah, so it needs to be only alphanumeric (lower case), plus
                    spaces, matching via a regex. Hmm. Well, it's only checking
                    the string pre-templating. Doesn't seem like the templating
                    engine can do anything with purely alphanumerics either. But
                    ooh, what if we somehow inject a newline into the string?
                    Would the regex consider the end of the newline as a match
                    and accept it? Let's try this payload:
                </Typography>
                <Inline>{`a%0A<%= 7*7 %>`}</Inline>
                <Typography>
                    Yep, after a bit of struggling with not being able to add
                    debug print statements to Ruby code (on account of not
                    knowing Ruby), enough brute force lands us a successful
                    injection, by encoding special characters with percent codes
                    (e.g. %25).
                </Typography>
                <Typography>
                    Finally, all we need is an RCE payload, and we can get
                    ourselves an easy flag.
                </Typography>
                <Inline>{`a%0A<%25= \`ls\` %25>`}</Inline>
                <Typography>
                    A quick note from future me - this exploit only works
                    because we have server-side template injection. We know this
                    because the app uses our input as a template, which makes no
                    sense in this context, and leads to an easily exploitable
                    vulnerability. Don't render user input as a template, folks.
                </Typography>
            </>
        );
    },
};
