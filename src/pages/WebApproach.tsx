import {
    Article,
    ExpandMore,
    Hardware,
    HeartBroken,
    OpenInNew,
} from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    CardActionArea,
    Container,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import LinkInternal from "~util/LinkInternal";
import Resource from "~util/Resource";

const recon = [
    [
        `Expected behaviour`,
        `What is the web app meant to do?`,
        `Helps you gain a high level understanding of what the application does to help orient you when you start diving into the source code.`,
    ],
    [
        `Installation files`,
        <Typography>
            What is installed, and what versions are they using? The following
            technologies use specific files to store their dependencies and
            versions.
            <ul>
                <li>Docker: Dockerfile</li>
                <li>NodeJS: package.json</li>
                <li>Python: requirements.txt</li>
                <li>Ruby: Gemfile</li>
            </ul>
            Sometimes an exploit is as simple as an out-of-date package or
            dependency having a known security vulnerability (i.e. a CVE).
        </Typography>,
        `Usually CVEs are fairly hard to discover by yourself, so if you can use an already known one, it will save you a lot of time and effort.`,
    ],
    [
        `Attack vectors`,
        <Typography>
            Anything that the user controls. This could include:
            <ul>
                <li>Web forms</li>
                <li>File uploads </li>
                <li>Backend API requests</li>
                <li>Query parameters</li>
                <li>Cookies</li>
            </ul>
        </Typography>,
        <Typography>
            You can't exploit an application if you can't affect its behaviour.
            Every exploit must start at an attack vector, so knowing the options
            available to you is important.
            <br />
            <br />
            Sometimes an exploit won't be possible with one vector, and you have
            to know another to succeed - for example using HTTP requests to
            bypass frontend validation.
        </Typography>,
    ],
    [
        `Security 'smells'`,
        <Typography>
            Basically, anything that makes you think "that's a little
            suspicious". To be more specific, anything that:
            <ul>
                <li>Overrides a default option</li>
                <li>Gives users unnecessary control</li>
            </ul>
            This is the hardest part of reconnaissance, since it hinges on you
            having experience with the system. Oftentimes you'll need to do
            background research on the technology stack you're exploiting if you
            haven't ever seen it before.
            <br />
            <br />
            See the Common Exploits section for a list of 'smells' and their
            associated exploit.
        </Typography>,
        `These are the main things you'll want to investigate in step 2.`,
    ],
];

const WebApproach = () => {
    const navigate = useNavigate();

    function navTo(url: string) {
        setTimeout(() => navigate(url), 250);
    }

    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h4">Web Testing Methodology</Typography>
            <Typography>
                This section discusses how I approached a new challenge, and
                provides a high-level summary of the steps and order in which I
                carried them out when testing a web application.
            </Typography>
            <Typography>
                Note that all HackTheBox challenges were provided with source,
                which gives a very different experience when doing
                reconnaissance for vulnerabilities compared to black-box
                testing. Having source access removes a lot of guesswork in
                initial reconnaissance, which while interesting would be quite
                time consuming. There are several scenarios where an attacker
                might have access to the source code such as when testing
                open-source projects or having access to insider information or
                another information leak.
            </Typography>
            <Typography variant="h5">Step 1: Reconnaissance</Typography>
            <Typography>
                During reconnaissance, my aim is breadth, rather than depth. The
                main goal is to identify as many potential vulnerabilities as
                possible, before diving deeper into each particular possible
                exploit in the second step. Effective recon is important because
                it prevents you from going down rabbit holes - generally the
                more thoroughly I identified the possible vulnerabilities, the
                less time I would waste chasing down empty leads later on due to
                tunnel vision. I found that reconnaissance was one of the
                hardest steps to do well, since it requires a significant amount
                of background knowledge and experience. For example, in the{" "}
                <LinkInternal nav={navigate} url="/writeups/easter">
                    Easter Bunny
                </LinkInternal>{" "}
                challenge, I didn't realise that caches could be poisoned, and
                so I didn't pick up the potential vulnerability during
                reconnaissance. The following table shows a list of
                reconnaissance methods that I commonly used.
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography style={{ fontWeight: 700 }}>
                                    What to look at?
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography style={{ fontWeight: 700 }}>
                                    What to look for?
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography style={{ fontWeight: 700 }}>
                                    Why is it important?
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recon.map((x) => (
                            <TableRow>
                                <TableCell>
                                    {typeof x[0] === "string" ? (
                                        <Typography>{x[0]}</Typography>
                                    ) : (
                                        x[0]
                                    )}
                                </TableCell>
                                <TableCell>
                                    {typeof x[1] === "string" ? (
                                        <Typography>{x[1]}</Typography>
                                    ) : (
                                        x[1]
                                    )}
                                </TableCell>
                                <TableCell>
                                    {typeof x[2] === "string" ? (
                                        <Typography>{x[2]}</Typography>
                                    ) : (
                                        x[2]
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h5">Step 2: Investigation</Typography>
            <Typography>
                After finding a list of possible vulnerabilities, we then need
                to investigate them to see whether they can actually be
                exploited. This is where I often ran into the most rabbit holes
                (long research spirals) and red herrings (things that seem to
                be, and often are vulnerabilities, but aren't relevant to the
                challenge).
            </Typography>
            <Typography>
                This involves both chasing down attack vectors as well as
                testing exploits and finding and running POC code. An important
                skill in this step is knowing when to persist and when to stop.
                Again, this is something that I got better at through practice.
                When I was starting off, I found it was usually better to give
                up later, since wasting time chasing down a dead end usually
                still teaches you something, whereas giving up too early can
                lead to lots of frustration and less learning.
            </Typography>
            <Typography variant="h6">Useful resources</Typography>
            <Typography>
                The following are useful resources for investigating exploits.
            </Typography>
            <Stack spacing={1}>
                <Resource
                    title="HackTricks"
                    url="https://book.hacktricks.xyz/pentesting-web/web-vulnerabilities-methodology"
                >
                    <Typography>
                        A hugely comprehensive list of many web exploits. Very
                        very useful when you have an idea of what you're looking
                        for already, but potentially overwhelming otherwise.
                    </Typography>
                </Resource>
                <Resource
                    title="PayloadsAllTheThings"
                    url="https://github.com/swisskyrepo/PayloadsAllTheThings"
                >
                    <Typography>
                        A GitHub repo containing a bunch of payloads for
                        verifying exploits. Useful for testing exploit proof of
                        concepts, but probably more useful in black-box
                        situations. I prefer HackTricks.
                    </Typography>
                </Resource>
                <Resource
                    title="PortSwigger"
                    url="https://portswigger.net/web-security/all-materials"
                >
                    <Typography>
                        Another huge repository of exploits, slightly better
                        organised than HackTricks, and very very useful.
                    </Typography>
                </Resource>
                <Resource
                    title="OWASP"
                    url="https://owasp.org/www-project-web-security-testing-guide/stable/"
                >
                    <Typography>
                        Yet another exploit repository. Well organised but not
                        as explicit with their explanations on how exploits
                        work.
                    </Typography>
                </Resource>
                <Resource
                    title="Burp Suite"
                    url="https://portswigger.net/burp/communitydownload"
                >
                    <Typography>
                        An extremely useful but simple tool for intercepting and
                        sending HTTP requests. Like Postman and DevTools
                        combined, basically everything you would ever want for
                        handling HTTP traffic.
                    </Typography>
                </Resource>
                <Resource title="Language documentation">
                    <Typography>
                        Don't forget to read the documentation of whatever
                        language or library you're trying to exploit! If it
                        isn't a CVE, it's a configuration error, and the best
                        place to find those is in documentation.
                    </Typography>
                </Resource>
            </Stack>
            <Typography variant="h5">Step 3: Exploitation</Typography>
            <Typography>
                Once I find a vulnerability, the final step is actually
                exploiting it. For simple exploits this is usually just sending
                a specially crafted request in Burp Suite, but sometimes a
                Python script is necessary.
            </Typography>
            <Typography>
                I don't have any specific tips for this step, since it depends
                greatly on what the vulnerability is. One thing that is really
                useful though, especially if you have source code available, is
                having a local instance which you can modify the code in. That
                way, you can debug your exploit just like you would debug a
                regular program - by throwing debug statements everywhere!
            </Typography>
            <Link
                onClick={() => window.scrollTo(0, 0)}
                underline="none"
                sx={{ cursor: "pointer" }}
            >{`^ Back to top`}</Link>
            <Box sx={{ mb: 4 }} />
        </Container>
    );
};

export default WebApproach;
