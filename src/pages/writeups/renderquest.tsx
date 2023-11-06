import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import Learning from "~util/Learning";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import RabbitHole from "~util/RabbitHole";
import RedHerring from "~util/RedHerring";
import SourcedImage from "~util/SourcedImage";
import render1 from "~img/render1.png";
import render2 from "~img/render2.png";
import render3 from "~img/render3.png";
import render4 from "~img/render4.png";

export const WriteupsRender = {
    path: "render",
    title: "RenderQuest",
    chalAuth: "leanthedev",
    chalAuthLink: "https://app.hackthebox.com/users/1338083",
    tags: ["Medium", "@Go", "SSTI"],
    description:
        "My first, Go-flavored experience with the insane power of SSTI.",
    reflection: () => {
        return (
            <>
                <Typography>
                    This was a fairly difficult challenge for me because of my
                    lack of experience with Go, and the fact that it was my
                    first time getting a server-side template injection.
                </Typography>
                <Learning title="SSTI is really bad">
                    This was the first time I'd done a server-side template
                    injection, and what's immediately clear is that it's really,
                    really bad. Templating engines seem very powerful, and
                    treating user input as a template is not that much better
                    than just straight up <Inline>eval</Inline>'ing it.
                </Learning>
                <Learning title="Beware the rabbit hole">
                    I got really distracted by the potential path traversal
                    vulnerability in this challenge, because I hadn't looked at
                    the entire codebase before diving in. For future challenges,
                    I need to make sure that I actually finish recon across the
                    entire codebase, even if something looks like an obvious
                    exploit, just in case there's another which is just as
                    obvious or more.
                </Learning>
                <Learning dev title="Understand the engine">
                    I can actually imagine myself accidentally making an app
                    which renders user input as the template, just because I
                    didn't understand what the template engine was able to do.
                    <br />
                    <br />
                    This reminds me of the classic newbie mistake of using a
                    format string to generate a SQL query, exposing a SQL
                    injection vulnerability. The common theme is that developers
                    should know the capability of the tools we're using, not
                    just whether they can do what they want us to do.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    First things first, spin up the container. While that's
                    downloading, we'll learn our lesson from last time and start
                    off with reading the Dockerfile. There doesn't seem to be
                    any very specific app versions set (except the node image,
                    which should be fine but we'll keep it in mind), which is
                    unfortunate. It seems like we're going to be dealing with
                    Go, which will be interesting seeing as I've never touched
                    the language.
                </Typography>

                <Typography>
                    Essentially, the app allows us to render arbitrary URLs as
                    templates with some given client and server data.
                </Typography>

                <SourcedImage src={render3} height="40vh" />
                <SourcedImage
                    src={render4}
                    caption="Rendering google.com"
                    height="15vh"
                />

                <Typography>
                    Hmm, templates. I suspect we'll be looking for some sort of
                    RCE. The container is up, so I'll take a look at that first
                    to see what attack vectors there are. Oh. I can make it
                    substitute data into arbitrary webpages. This seems uh,
                    powerful. Back to the source code for now so we can see what
                    RCE potential there is.
                </Typography>
                <MultiLine language="go">
                    {`func (p RequestData) FetchServerInfo(command string) string {
	out, err := exec.Command("sh", "-c", command).Output()
	if err != nil {
		return ""
	}
	return string(out)
}`}
                </MultiLine>
                <Typography>
                    Huh. That's a suspicious looking function if ever I've seen
                    one. Running arbitrary commands seems safe to me.
                </Typography>
                <RedHerring
                    title="FetchServerInfo calls which include user input"
                    size="Small"
                >
                    There aren't any. The function only calls it on existing
                    strings. We'll need another way in.
                </RedHerring>
                <RedHerring
                    title="Path traversal, but not actually"
                    size="Large"
                >
                    <Typography>
                        Another suspicious thing I found where perusing the
                        source code - we're being allowed to use internal pages
                        as templates if the 'remote' query parameter is false.
                        Perhaps this is a path traversal vulnerability?
                    </Typography>

                    <MultiLine language="go">
                        {`if remote == "true" {
    ...
} else {
    tmplFile, err = readFile(TEMPLATE_DIR+"/"+page, "./")
    ...`}
                    </MultiLine>
                    <Typography>
                        So, can't I just send a request to get the flag? Let's
                        try it out. Getting just <Inline>index.tpl</Inline>{" "}
                        works - let's see if we can do anything else.
                    </Typography>
                    <Inline>{`/render?use_remote=false&page=<local path>`}</Inline>
                    <Typography>
                        <Inline>../../flag.txt</Inline> doesn't work and neither
                        does its URL encoded equivalent,{" "}
                        <Inline>%2E%2E%2F%2E%2E%2Fflag%2Etxt</Inline> - let's
                        try something from the static folder. Ooh,{" "}
                        <Inline>../static/js/script.js</Inline> works. What
                        about <Inline>../main.go</Inline>? Yep, working too.
                    </Typography>
                    <SourcedImage
                        src={render1}
                        caption="Rendering a local page with path traversal"
                        height="60vh"
                    />
                    <Typography>
                        Enough guessing though - if we want to evade this
                        filter, we'll need to take a look back at the code. It
                        seems like they've rolled their own function to check
                        whether a path is a subdirectory of another path and are
                        using that to prevent access beyond the source
                        directory.
                    </Typography>
                    <RabbitHole
                        title="How does their filter work?"
                        size="Medium"
                    >
                        <Typography>
                            Sadly, not knowing the Go language, I need to figure
                            out how their path filter works manually.
                        </Typography>
                        <MultiLine language="go">
                            {`func isSubdirectory(basePath, path string) bool {
	fmt.Println("path: " + path)
	rel, err := filepath.Rel(basePath, path)
	fmt.Println("rel: " + rel)
	if err != nil {
		return false
	}
	return !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}`}
                        </MultiLine>
                        <Typography>
                            Those <Inline>Println</Inline> debugging calls were
                            added by me in an attempt to figure out what was
                            going on. At this stage, I was experiencing some
                            pretty intense tunnel vision and was convinced that
                            this could somehow be bypassed.
                        </Typography>
                        <Typography>
                            This led to me checking whether the{" "}
                            <Inline>Rel</Inline> function does anything funny.
                            According to the Go documentation:
                        </Typography>
                        <Quote
                            sourceName="Go documentation"
                            sourceLink="https://pkg.go.dev/path/filepath#example-Rel"
                        >
                            Rel returns a relative path that is lexically
                            equivalent to targpath when joined to basepath with
                            an intervening separator. That is, Join(basepath,
                            Rel(basepath, targpath)) is equivalent to targpath
                            itself. On success, the returned path will always be
                            relative to basepath, even if basepath and targpath
                            share no elements. An error is returned if targpath
                            can't be made relative to basepath or if knowing the
                            current working directory would be necessary to
                            compute it. Rel calls Clean on the result.
                        </Quote>
                        <Typography>
                            The <Inline>Clean</Inline> function always returns
                            the shortest equivalent path, so any path that
                            leaves the source directory will probably start with{" "}
                            <Inline>../</Inline>, so there's not much we can do
                            here.
                        </Typography>
                        <Typography>
                            I actually also took a look at the implementation of
                            the functions in Go's source code, but this wasn't
                            that interesting - except for the fact that these
                            functions were all implemented as string operations.
                            That seem interesting, since I assumed that they'd
                            be working with some sort of structured path object.
                            Because of this, there might actually be a
                            vulnerability here, but it's probably not the one
                            I'm looking for.
                        </Typography>
                        <Typography>
                            Also, even though this finding wasn't that useful
                            for this challenge, since we already have source
                            access, this kind of vulnerability would be a
                            goldmine for black-box recon, meaning that it still
                            is a vulnerability.
                        </Typography>
                    </RabbitHole>
                    <Typography>
                        Nope - doesn't seem like we'll be able to avoid this
                        filter. Time to look elsewhere.
                    </Typography>
                </RedHerring>
                <Typography>
                    After a couple of red herrings, I was seriously running out
                    of ideas. I did look up Go CVEs but didn't find anything
                    interesting, so finally I decided to have a look at the
                    template rendering process.
                </Typography>
                <MultiLine language="go">
                    {`tmpl, err := template.New("page").Parse(tmplFile)
if err != nil {
    fmt.Println(err)
    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
    return
}

err = tmpl.Execute(w, reqData)
if err != nil {
    fmt.Println(err)
    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
    return
}`}
                </MultiLine>
                <Typography>
                    Oh. Wait. They're letting me choose a template, not inject
                    into an existing one. That sounds like a vulnerability.
                    Let's try and find a proof of concept payload. From{" "}
                    <Link
                        href="https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#ssti-in-go"
                        target="_blank"
                    >
                        HackTricks
                    </Link>
                    , we get the following payload, which we put into a Pastebin
                    to be rendered.
                </Typography>
                <Inline>{`{{printf "%s" "ssti" }}`}</Inline>
                <SourcedImage
                    src={render2}
                    caption="Why host a page when you can use Pastebin?"
                    height="30vh"
                />
                <Typography>
                    This works nicely, generating the output{" "}
                    <Inline>ssti</Inline>, indicating that we can go ahead to
                    try and get RCE. Again, HackTricks is our friend.
                </Typography>
                <Quote
                    sourceLink="https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection#ssti-in-go"
                    sourceName="HackTricks"
                >
                    {`If you want to find a RCE in go via SSTI, you should know that as you can access the given object to the template with {{ . }}, you can also call the objects methods. So, imagine that the passed object has a method called System that executes the given command, you could abuse it with: {{ .System "ls" }}`}
                </Quote>
                <Typography>
                    Hmm, I don't know any suspicious functions that call
                    arbitrary shell commands. Just kidding. Having looked at the
                    source code enough, I know that the{" "}
                    <Inline>FetchServerInfo</Inline> function is a method of the{" "}
                    <Inline>reqData</Inline> object which gets injected into the
                    template. Not sure why they left such an egregiously
                    vulnerable function in the template object, but I'm not
                    complaining.
                </Typography>
                <MultiLine language="go">
                    {`reqData.ServerInfo.Hostname = reqData.FetchServerInfo("hostname")
...
err = tmpl.Execute(w, reqData)`}
                </MultiLine>
                <Typography>
                    The challenge is pretty straightforward from here, we change
                    our Pastebin to the following...
                </Typography>
                <Inline>{`{{ .FetchServerInfo "ls" }}`}</Inline>
                <Typography>...which gives us RCE and our flag.</Typography>
            </>
        );
    },
};
