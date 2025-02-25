import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Form, Modal } from 'react-bootstrap'
import Tooltip from '../../Tooltip/Tooltip'
import Countdown, { zeroPad } from 'react-countdown'
import { v4 as generateUUID } from 'uuid'
import FlipRestrictionList from '../FlipRestrictionList/FlipRestrictionList'
import { BallotOutlined as FilterIcon } from '@mui/icons-material'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { FLIPPER_FILTER_KEY, getSettingsObject, mapRestrictionsToApiFormat, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import styles from './FlipperFilter.module.css'
import api from '../../../api/ApiHelper'
import { getDecimalSeperator, getThousandSeperator } from '../../../utils/Formatter'
import { DEFAULT_FLIP_SETTINGS } from '../../../utils/FlipUtils'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'

interface Props {
    onChange(filter: FlipperFilter)
    isLoggedIn?: boolean
    isPremium?: boolean
}

let FREE_PREMIUM_SPAN = 1000 * 60 * 5
let FREE_LOGIN_SPAN = 1000 * 60 * 6

let FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN
let FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN

function FlipperFilter(props: Props) {
    let defaultFilter = getSettingsObject<FlipperFilter>(FLIPPER_FILTER_KEY, DEFAULT_FLIP_SETTINGS.FILTER)

    let [onlyBin, setOnlyBin] = useState(defaultFilter.onlyBin || DEFAULT_FLIP_SETTINGS.FILTER.onlyBin)
    let [onlyUnsold, setOnlyUnsold] = useState(props.isPremium == null ? false : defaultFilter.onlyUnsold || DEFAULT_FLIP_SETTINGS.FILTER.onlyUnsold)
    let [minProfit, setMinProfit] = useState(defaultFilter.minProfit || DEFAULT_FLIP_SETTINGS.FILTER.minProfit)
    let [minProfitPercent, setMinProfitPercent] = useState(defaultFilter.minProfitPercent || DEFAULT_FLIP_SETTINGS.FILTER.minProfitPercent)
    let [minVolume, setMinVolume] = useState(defaultFilter.minVolume || DEFAULT_FLIP_SETTINGS.FILTER.minVolume)
    let [maxCost, setMaxCost] = useState<number>(defaultFilter.maxCost || DEFAULT_FLIP_SETTINGS.FILTER.maxCost)
    let [freePremiumFilters, setFreePremiumFilters] = useState(false)
    let [freeLoginFilters, setFreeLoginFilters] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
    let [uuids, setUUIDs] = useState<string[]>([])
    let [showRestrictionList, setShowRestrictionList] = useState(false)

    let onlyUnsoldRef = useRef(null)

    useEffect(() => {
        let newUuids: string[] = []
        for (let index = 0; index < 10; index++) {
            newUuids.push(generateUUID())
        }
        setUUIDs(newUuids)
        FREE_PREMIUM_FILTER_TIME = new Date().getTime() + FREE_PREMIUM_SPAN
        FREE_LOGIN_FILTER_TIME = new Date().getTime() + FREE_LOGIN_SPAN

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getCurrentFilter(): FlipperFilter {
        return {
            onlyBin: onlyBin,
            minProfit: minProfit,
            maxCost: maxCost,
            minProfitPercent: minProfitPercent,
            onlyUnsold: onlyUnsold,
            minVolume: minVolume
        }
    }

    function onFilterChange(filter: FlipperFilter) {
        if (props.isLoggedIn) {
            let filterToSave = JSON.parse(JSON.stringify(filter))
            if (!props.isPremium) {
                filterToSave.onlyBin = undefined
                filterToSave.onlyUnsold = undefined
            }
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        } else {
            setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
        }

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))
        props.onChange(filter)
    }

    function onOnlyBinChange(event: ChangeEvent<HTMLInputElement>) {
        setOnlyBin(event.target.checked)
        let filter = getCurrentFilter()
        filter.onlyBin = event.target.checked
        api.setFlipSetting('onlyBin', event.target.checked)
        onFilterChange(filter)
    }

    function onOnlyUnsoldChange(event: ChangeEvent<HTMLInputElement>) {
        let isActive = event.target.checked
        updateOnlyUnsold(isActive)
    }

    function onMinProfitChange(value: NumberFormatValues) {
        let val = value.floatValue || 0
        setMinProfit(val)
        let filter = getCurrentFilter()
        filter.minProfit = val
        api.setFlipSetting('minProfit', val)
        onFilterChange(filter)
    }

    function onMinProfitPercentChange(value: NumberFormatValues) {
        let val = value.floatValue || 0
        setMinProfitPercent(val)
        let filter = getCurrentFilter()
        filter.minProfitPercent = val
        api.setFlipSetting('minProfitPercent', val)
        onFilterChange(filter)
    }

    function onMaxCostChange(value: NumberFormatValues) {
        let val = value.floatValue || 0
        setMaxCost(val)
        let filter = getCurrentFilter()
        filter.maxCost = val
        api.setFlipSetting('maxCost', val)
        onFilterChange(filter)
    }

    function updateOnlyUnsold(isActive: boolean) {
        setOnlyUnsold(isActive)
        let filter = getCurrentFilter()
        filter.onlyUnsold = isActive
        api.setFlipSetting('showHideSold', isActive)
        onFilterChange(filter)
    }

    function onMinVolumeChange(value: NumberFormatValues) {
        let val = value.floatValue || 0
        setMinVolume(val)
        let filter = getCurrentFilter()
        filter.minVolume = val
        api.setFlipSetting('minVolume', val)
        onFilterChange(filter)
    }

    function onRestrictionsChange(restrictions: FlipRestriction[], type: 'blacklist' | 'whitelist') {
        setRestrictions(restrictions)
        api.setFlipSetting(type, mapRestrictionsToApiFormat(restrictions.filter(restriction => restriction.type === type)))
    }

    function onFreePremiumComplete() {
        setFreePremiumFilters(true)
    }

    function onFreeLoginComplete() {
        setFreeLoginFilters(true)
    }

    const countdownRenderer = ({ minutes, seconds }) => (
        <span>
            {zeroPad(minutes)}:{zeroPad(seconds)}
        </span>
    )

    function numberFieldMaxValue(value: number = 0, maxValue: number) {
        return value <= maxValue
    }

    let restrictionListDialog = (
        <Modal
            size={'xl'}
            show={showRestrictionList}
            onHide={() => {
                setShowRestrictionList(false)
            }}
            scrollable={true}
        >
            <Modal.Header closeButton>
                <Modal.Title>Restrict the flip results</Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.restrictionModal}>
                <FlipRestrictionList onRestrictionsChange={onRestrictionsChange} />
            </Modal.Body>
        </Modal>
    )

    const nonPremiumTooltip = (
        <span key="nonPremiumTooltip">
            This is a premium feature.
            <br />
            (to use for free wait <Countdown key={uuids[0]} date={FREE_PREMIUM_FILTER_TIME} renderer={countdownRenderer} />)
        </span>
    )
    const nonLoggedInTooltip = (
        <span key="nonLoggedInTooltip">
            Login to use these filters.
            <br />
            (or wait <Countdown key={uuids[1]} date={FREE_LOGIN_FILTER_TIME} renderer={countdownRenderer} />)
        </span>
    )

    const binFilter = (
        <Form.Group className={styles.filterCheckbox}>
            <Form.Label htmlFor="onlyBinCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                Only BIN-Auctions
            </Form.Label>
            <Form.Check
                id="onlyBinCheckbox"
                onChange={onOnlyBinChange}
                defaultChecked={onlyBin}
                className={styles.flipperFilterFormfield}
                type="checkbox"
                disabled={!props.isPremium && !freePremiumFilters}
            />
        </Form.Group>
    )

    const soldFilter = (
        <Form.Group className={styles.filterCheckbox}>
            <Form.Label htmlFor="onlyUnsoldCheckbox" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                Hide SOLD Auctions
            </Form.Label>
            <Form.Check
                ref={onlyUnsoldRef}
                id="onlyUnsoldCheckbox"
                onChange={onOnlyUnsoldChange}
                defaultChecked={onlyUnsold}
                className={styles.flipperFilterFormfield}
                type="checkbox"
                disabled={!props.isPremium && !freePremiumFilters}
            />
        </Form.Group>
    )

    const openRestrictionListDialog = (
        <div
            onClick={() => {
                setShowRestrictionList(true)
            }}
            className={styles.filterCheckbox}
            style={{ cursor: 'pointer' }}
        >
            <span className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>Blacklist</span>
            <FilterIcon className={styles.flipperFilterFormfield} style={{ marginLeft: '-4px' }} />
        </div>
    )

    const numberFilters = (
        <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'flex-start' }}>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label htmlFor="min-profit" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                    Min. Profit:
                </Form.Label>
                <NumberFormat
                    id="min-profit"
                    onValueChange={onMinProfitChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    type="text"
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                    isAllowed={value => {
                        return numberFieldMaxValue(value.floatValue, 2147483647)
                    }}
                    customInput={Form.Control}
                    defaultValue={minProfit}
                    thousandSeparator={getThousandSeperator()}
                    decimalSeparator={getDecimalSeperator()}
                    allowNegative={false}
                    decimalScale={0}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label htmlFor="min-profit-percent" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                    Min. Profit (%):
                </Form.Label>
                <NumberFormat
                    id="min-profit-percent"
                    onValueChange={onMinProfitPercentChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                    isAllowed={value => {
                        return numberFieldMaxValue(value.floatValue, 2147483647)
                    }}
                    customInput={Form.Control}
                    defaultValue={minProfitPercent}
                    thousandSeparator={getThousandSeperator()}
                    decimalSeparator={getDecimalSeperator()}
                    allowNegative={false}
                    decimalScale={0}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label htmlFor="min-volume" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                    Min. Volume:
                </Form.Label>
                <NumberFormat
                    id="min-volume"
                    onValueChange={onMinVolumeChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                    isAllowed={value => {
                        return numberFieldMaxValue(value.floatValue, 120)
                    }}
                    customInput={Form.Control}
                    defaultValue={minVolume}
                    thousandSeparator={getThousandSeperator()}
                    decimalSeparator={getDecimalSeperator()}
                    allowNegative={false}
                    decimalScale={1}
                />
            </Form.Group>
            <Form.Group className={styles.filterTextfield}>
                <Form.Label htmlFor="max-cost" className={`${styles.flipperFilterFormfieldLabel} ${styles.checkboxLabel}`}>
                    Max. Cost:
                </Form.Label>
                <NumberFormat
                    id="max-cost"
                    onValueChange={onMaxCostChange}
                    className={`${styles.flipperFilterFormfield} ${styles.flipperFilterFormfieldText}`}
                    disabled={!props.isLoggedIn && !freeLoginFilters}
                    isAllowed={value => {
                        return numberFieldMaxValue(value.floatValue, 2147483647)
                    }}
                    customInput={Form.Control}
                    defaultValue={maxCost}
                    thousandSeparator={getThousandSeperator()}
                    decimalSeparator={getDecimalSeperator()}
                    allowNegative={false}
                    decimalScale={0}
                />
            </Form.Group>
        </div>
    )

    return (
        <div className={styles.flipperFilter}>
            <Form style={{ marginBottom: '5px' }}>
                {!props.isLoggedIn && !freeLoginFilters ? <Tooltip type="hover" content={numberFilters} tooltipContent={nonLoggedInTooltip} /> : numberFilters}
                <div className={styles.premiumFilters}>
                    {!props.isPremium && !freePremiumFilters ? <Tooltip type="hover" content={binFilter} tooltipContent={nonPremiumTooltip} /> : binFilter}

                    {!props.isPremium && !freePremiumFilters ? <Tooltip type="hover" content={soldFilter} tooltipContent={nonPremiumTooltip} /> : soldFilter}
                    {openRestrictionListDialog}
                </div>

                <div style={{ visibility: 'hidden', height: 0 }}>
                    <Countdown key={uuids[2]} onComplete={onFreePremiumComplete} date={FREE_PREMIUM_FILTER_TIME} />
                    <Countdown key={uuids[3]} onComplete={onFreeLoginComplete} date={FREE_LOGIN_FILTER_TIME} />
                </div>
            </Form>
            {restrictionListDialog}
        </div>
    )
}

export default React.memo(FlipperFilter)
