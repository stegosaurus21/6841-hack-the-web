import { Container, Link, Paper, Typography } from "@mui/material";
import * as React from "react";

const Quote = (props: {
    sourceLink: string;
    sourceName: string;
    children: any;
}) => {
    return (
        <Paper sx={{ m: 2 }} elevation={3}>
            <Container sx={{ p: 1 }}>
                <Typography sx={{ m: 0, mb: 1 }}>
                    {props.children as string}
                </Typography>
                <span style={{ fontSize: 10, fontWeight: 700 }}>Source: </span>
                <Link
                    style={{ fontSize: 10, fontWeight: 700 }}
                    href={props.sourceLink}
                    target="_blank"
                    underline="always"
                >
                    {props.sourceName}
                </Link>
            </Container>
        </Paper>
    );
};

export default Quote;
