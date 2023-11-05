import { Article, Hardware, Psychology } from "@mui/icons-material";
import {
    Box,
    Card,
    CardActionArea,
    Container,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { writeups } from "./writeups";
import LinkInternal from "~util/LinkInternal";

const Reflections = () => {
    const navigate = useNavigate();

    function navTo(url: string) {
        setTimeout(() => navigate(url), 250);
    }

    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h4">Reflections</Typography>
            <Typography>
                This page is a summary of all the reflections I made at the end
                of each challenge completed during the project. These are
                identical to the reflections at the end of each writeup, but
                condensed to provide a summary of my learning.
            </Typography>
            <Stack spacing={2}>
                {writeups.map((x) => (
                    <Card
                        sx={{
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <LinkInternal
                            variant="h5"
                            nav={navigate}
                            url={`/writeups/${x.path}`}
                        >
                            {x.title}
                        </LinkInternal>
                        <x.reflection />
                    </Card>
                ))}
            </Stack>
        </Container>
    );
};

export default Reflections;
