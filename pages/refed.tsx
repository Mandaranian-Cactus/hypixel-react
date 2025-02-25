import React, { useState } from 'react'
import { Button, Container, Card } from 'react-bootstrap'
import Link from 'next/link'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import Search from '../components/Search/Search'
import { Help as HelpIcon } from '@mui/icons-material'
import { getHeadElement } from '../utils/SSRUtils'
import Tooltip from '../components/Tooltip/Tooltip'
import { useWasAlreadyLoggedIn } from '../utils/Hooks'

function Refed() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    return (
        <div className="page">
            {getHeadElement()}
            <Container>
                <Search />
                <Card>
                    <Card.Header>
                        <Card.Title>Invitation</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>You were invited to use this application because someone thought it would be interesting and helpful to you.</p>
                        <p>
                            After you are logged in with Google you can verify your Minecraft account{' '}
                            <Tooltip
                                content={
                                    <span>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={
                                    <p>
                                        To connect your Minecraft account, search and click yourself in the search bar. Afterwards click "You? Claim account."
                                        to get a full explanation.{' '}
                                    </p>
                                }
                            />{' '}
                            to get 24 hours of our <Link href="/premium">premium plan</Link> for free. That includes our{' '}
                            <Link href="/flipper">advanced auction flipper</Link>.
                        </p>
                        <p>
                            We also provide a Minecraft mod to use the flipper in game. You can download it in the <b>#mod-releases</b> channel on our{' '}
                            <a href="https://discord.gg/wvKXfTgCfb">
                                <span style={{ color: '#7289da' }}>Discord</span>
                            </a>
                            . For help check out the{' '}
                            <Link href="/flipper#faq" passHref>
                                #faq
                            </Link>{' '}
                            or ask us on our{' '}
                            <a href="https://discord.gg/wvKXfTgCfb">
                                <span style={{ color: '#7289da' }}>Discord</span>
                            </a>
                            .
                        </p>
                        <hr />
                        {!isLoggedIn && !wasAlreadyLoggedIn ? <p>Login with Google:</p> : null}
                        <GoogleSignIn
                            onAfterLogin={() => {
                                setIsLoggedIn(true)
                            }}
                        />
                        <p>
                            Settings you make are tied to your google account to sync across devices and into the Minecraft mod. 
                            what settings you made and contact you in case we need to)
                        </p>

                        <Link href="/">
                            <a className="disableLinkStyle">
                                <Button>Go to main page</Button>
                            </a>
                        </Link>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default Refed
