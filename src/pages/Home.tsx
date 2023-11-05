import { Article, Hardware, Psychology } from "@mui/icons-material";
import {
    Card,
    CardActionArea,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import * as React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    function navTo(url: string) {
        setTimeout(() => navigate(url), 250);
    }

    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h4">Hack the Web</Typography>
            <Typography>
                This page is intended as a documentation of my learning after
                completing web challenges on HackTheBox for the UNSW COMP6841
                Something Awesome Project. However, it is also designed to be a
                guide accessible to hobby web developers interested in trying
                out web penetration testing.
            </Typography>
            <Typography>
                I chose web security for my project because of how prevalent and
                ubiquitous websites are, and how frequently we interact with
                them every day. Engineers have a responsibility to ensure that
                web applications protect user data, and the first step in this
                is being aware of potential attacks. But apart from its obvious
                importance, it's also a fun application of analytical and
                creative skills to break things!
            </Typography>
            <Typography>
                All challenges described here were hosted on HackTheBox. Go
                check them out if you'd like to try some web challenges
                yourself!
            </Typography>
            <Stack spacing={2}>
                <CardActionArea onClick={() => navTo("./approach")}>
                    <Card
                        sx={{
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                        elevation={3}
                    >
                        <Psychology
                            color="secondary"
                            sx={{ fontSize: "4vh" }}
                        />
                        <Typography variant="h5">Methodology</Typography>
                    </Card>
                </CardActionArea>
                <CardActionArea onClick={() => navTo("./writeups")}>
                    <Card
                        sx={{
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                        elevation={3}
                    >
                        <Article color="primary" sx={{ fontSize: "4vh" }} />
                        <Typography variant="h5">Writeups</Typography>
                    </Card>
                </CardActionArea>

                <CardActionArea href="https://app.hackthebox.com/challenges">
                    <Card
                        sx={{
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                        elevation={3}
                    >
                        <Hardware color="success" sx={{ fontSize: "4vh" }} />
                        <Typography variant="h5">
                            Try some challenges!
                        </Typography>
                    </Card>
                </CardActionArea>
            </Stack>
        </Container>
    );
};

export default Home;
