import {
    AppBar,
    Box,
    Button,
    Container,
    Link,
    Toolbar,
    Typography,
} from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <AppBar position="static">
            <Toolbar disableGutters>
                <Container sx={{ display: "flex", gap: 3 }}>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{ mr: 3, cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    >
                        Hack the Web
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/approach")}
                    >
                        Methodology
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/writeups")}
                    >
                        Writeups
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/reflections")}
                    >
                        Reflections
                    </Typography>
                </Container>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
