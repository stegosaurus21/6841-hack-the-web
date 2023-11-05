import { Container, Link, Paper, Typography } from "@mui/material";
import * as React from "react";

const LinkInternal = (props: {
    variant?: string;
    nav: any;
    url: string;
    children: any;
}) => {
    return (
        <Link
            variant={props.variant || ""}
            sx={{ cursor: "pointer" }}
            onClick={() => props.nav(props.url)}
        >
            {props.children}
        </Link>
    );
};

export default LinkInternal;
